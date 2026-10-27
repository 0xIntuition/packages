import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { WIKIMEDIA_USER_AGENT } from '@0xintuition/atom-enrichment/provider-fetch';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { createClassificationEngine } from '../src/engine';
import {
	createTypeProfilesPlugin,
	createWikidataPlugin,
	createWikipediaPlugin,
} from '../src/plugins/index';
import type { PlatformStageInput } from '../src/plugins/shared/platform';
import { createWikidataEntityDataAdapter } from '../src/plugins/wikidata';
import { createWikipediaDomainApiAdapter } from '../src/plugins/wikipedia';

useStubbedPublicDns();

/**
 * The Wikidata and Wikipedia domain-api stages (ENG-17015): guarded pinned fetch, the stage signal,
 * a body cap, structured diagnostics with Retry-After, the Wikimedia User-Agent and one
 * `classify_entity` / `classify_summary` event per lookup. Driven through the real classification
 * engine; only fetch is replaced.
 */

let events: ProviderEvent[];
const requests = () =>
	events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
const tuples = () =>
	requests().map(({ provider, operation, outcome, reason, source }) => ({
		provider,
		operation,
		outcome,
		reason,
		source,
	}));
const tuple = (
	provider: 'wikidata' | 'wikipedia',
	operation: ProviderRequestEvent['operation'],
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({ provider, operation, outcome, reason, source: 'live' as const });

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

type Handler = (input: string, init?: RequestInit) => Response | Promise<Response>;

const entityBody = (qid = 'Q42', p31 = 'Q5') => ({
	entities: {
		[qid]: {
			claims: { P31: [{ mainsnak: { datavalue: { value: { id: p31 } } } }] },
			labels: { en: { value: 'Douglas Adams' } },
		},
	},
});

async function classifyWikidata(handler: Handler, extra: { resolverTimeoutMs?: number } = {}) {
	const engine = createClassificationEngine({
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createWikidataPlugin({
				fetch: createPinAwareFetch(async (url, init) => await handler(url, init)),
			}),
		],
		runtime: 'server',
		...extra,
	});
	const result = await engine.classify({
		classificationSessionId: 'wikidata-stage',
		input: 'https://www.wikidata.org/wiki/Q42',
		mode: 'server-only',
	});
	return { result, engine };
}

const stageErrors = (result: Awaited<ReturnType<typeof classifyWikidata>>['result']) =>
	(result.resolverErrors ?? []).map((error) => error.message);

describe('Wikidata classify_entity', () => {
	it('a 200 records one classify_entity hit and sends the Wikimedia User-Agent', async () => {
		const seen: Array<{ url: string; ua: string | null }> = [];
		const { result } = await classifyWikidata(async (url, init) => {
			seen.push({ url, ua: new Headers(init?.headers).get('user-agent') });
			return Response.json(entityBody());
		});
		expect(result.resolved?.atoms[0]?.title).toBe('Douglas Adams');
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
		expect(seen).toEqual([
			{
				url: 'https://www.wikidata.org/wiki/Special:EntityData/Q42.json',
				ua: WIKIMEDIA_USER_AGENT,
			},
		]);
	});

	it('a 404 is a miss and no stage error; the paste still classifies from the generic fallback', async () => {
		const { result } = await classifyWikidata(
			async () => new Response('Not Found', { status: 404 })
		);
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'miss')]);
		expect(stageErrors(result)).toEqual([]);
		expect(result.resolved?.atoms[0]).toMatchObject({ canonicalId: 'wd:Q42' });
	});

	it('a 200 without the entity is a miss', async () => {
		await classifyWikidata(async () => Response.json({ entities: {} }));
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'miss')]);
	});

	it('429 keeps Retry-After in the stage error and is rate_limited in the metric', async () => {
		const { result } = await classifyWikidata(
			async () => new Response('', { status: 429, headers: { 'retry-after': '12' } })
		);
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'error', 'rate_limited')]);
		const errors = stageErrors(result);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toContain('non_ok_status');
		expect(errors[0]).toContain('HTTP 429');
		expect(errors[0]).toContain('retryAfterMs=12000');
	});

	it('403 (User-Agent refused) is auth_failed; 500 is upstream_5xx', async () => {
		await classifyWikidata(async () => new Response('', { status: 403 }));
		await classifyWikidata(async () => new Response('', { status: 500 }));
		expect(tuples()).toEqual([
			tuple('wikidata', 'classify_entity', 'error', 'auth_failed'),
			tuple('wikidata', 'classify_entity', 'error', 'upstream_5xx'),
		]);
	});

	it('an unparseable body is invalid_response and a parse_failure stage error (no longer a silent miss)', async () => {
		const { result } = await classifyWikidata(async () => new Response('<html>', { status: 200 }));
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'error', 'invalid_response')]);
		expect(stageErrors(result)[0]).toContain('parse_failure');
	});

	it('an over-budget body is capped while reading (no content-length needed) and degrades to bare wd', async () => {
		const big = JSON.stringify({
			entities: { Q42: { labels: { en: { value: 'x'.repeat(600_000) } } } },
		});
		const { result } = await classifyWikidata(async () => new Response(big, { status: 200 }));
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'wd:Q42',
			metadata: { identityProjectionReason: 'entitydata_response_too_large' },
		});
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'error', 'invalid_response')]);
	});

	it('the stage signal reaches fetch and the resolver deadline records exactly one timeout', async () => {
		let seen: AbortSignal | undefined;
		await classifyWikidata(
			(_url, init) => {
				seen = init?.signal ?? undefined;
				return new Promise<Response>(() => {});
			},
			{ resolverTimeoutMs: 40 }
		);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(seen?.aborted).toBe(true);
		expect(tuples()).toEqual([tuple('wikidata', 'classify_entity', 'error', 'timeout')]);
	});

	it('does not record the enrichment operation: classification never writes wikidata|entity', async () => {
		await classifyWikidata(async () => Response.json(entityBody()));
		expect(requests()).toHaveLength(1);
		expect(requests()[0]?.operation).toBe('classify_entity');
	});
});

const summaryBody = {
	title: 'Manon Rheaume',
	description: 'Canadian ice hockey goaltender',
	extract: 'Manon Rheaume is a Canadian former ice hockey goaltender.',
	content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Manon_Rh%C3%A9aume' } },
	wikibase_item: 'Q257145',
};

async function classifyWikipedia(handler: Handler, extra: { resolverTimeoutMs?: number } = {}) {
	const engine = createClassificationEngine({
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createWikipediaPlugin({
				fetch: createPinAwareFetch(async (url, init) => await handler(url, init)),
			}),
		],
		runtime: 'server',
		...extra,
	});
	return await engine.classify({
		classificationSessionId: 'wikipedia-stage',
		input: 'https://en.wikipedia.org/wiki/Manon_Rh%C3%A9aume',
		mode: 'server-only',
	});
}

describe('Wikipedia classify_summary', () => {
	it('a 200 records one classify_summary hit and sends the Wikimedia User-Agent', async () => {
		const seen: Array<{ url: string; ua: string | null }> = [];
		const result = await classifyWikipedia(async (url, init) => {
			seen.push({ url, ua: new Headers(init?.headers).get('user-agent') });
			return Response.json(summaryBody);
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Person',
			title: 'Manon Rheaume',
		});
		expect(tuples()).toEqual([tuple('wikipedia', 'classify_summary', 'hit')]);
		expect(seen).toEqual([
			{
				url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Manon%20Rh%C3%A9aume',
				ua: WIKIMEDIA_USER_AGENT,
			},
		]);
	});

	it('a 404 is a miss and no stage error', async () => {
		const result = await classifyWikipedia(async () =>
			Response.json({ status: 404 }, { status: 404 })
		);
		expect(tuples()).toEqual([tuple('wikipedia', 'classify_summary', 'miss')]);
		expect((result.resolverErrors ?? []).map((error) => error.message)).toEqual([]);
	});

	it('429 keeps Retry-After in the stage error and is rate_limited in the metric', async () => {
		const result = await classifyWikipedia(
			async () => new Response('', { status: 429, headers: { 'retry-after': '9' } })
		);
		expect(tuples()).toEqual([tuple('wikipedia', 'classify_summary', 'error', 'rate_limited')]);
		const message = (result.resolverErrors ?? []).map((error) => error.message).join('|');
		expect(message).toContain('HTTP 429');
		expect(message).toContain('retryAfterMs=9000');
	});

	it('503 is upstream_5xx with the status in the stage error, 403 is auth_failed', async () => {
		const result = await classifyWikipedia(async () => new Response('', { status: 503 }));
		await classifyWikipedia(async () => new Response('', { status: 403 }));
		expect(tuples()).toEqual([
			tuple('wikipedia', 'classify_summary', 'error', 'upstream_5xx'),
			tuple('wikipedia', 'classify_summary', 'error', 'auth_failed'),
		]);
		expect((result.resolverErrors ?? []).map((error) => error.message).join('|')).toContain(
			'HTTP 503'
		);
	});

	it('an unparseable body is invalid_response and a parse_failure stage error', async () => {
		const result = await classifyWikipedia(async () => new Response('<html>', { status: 200 }));
		expect(tuples()).toEqual([tuple('wikipedia', 'classify_summary', 'error', 'invalid_response')]);
		expect((result.resolverErrors ?? []).map((error) => error.message).join('|')).toContain(
			'parse_failure'
		);
	});

	it('a summary over the 256 KiB summary cap (but under the 1 MiB provider ceiling) is cut off as a parse_failure', async () => {
		// ~300 KB: over MAX_SUMMARY_BYTES (256 KiB), under the shared 1 MiB default, so only the
		// adapter's own cap can reject it.
		const huge = JSON.stringify({ ...summaryBody, extract: 'x'.repeat(300_000) });
		const result = await classifyWikipedia(async () => new Response(huge, { status: 200 }));
		expect(tuples()).toEqual([tuple('wikipedia', 'classify_summary', 'error', 'invalid_response')]);
		expect((result.resolverErrors ?? []).map((error) => error.message).join('|')).toContain(
			'parse_failure'
		);
	});

	it('honours the stage signal: the resolver deadline records exactly one timeout (it used to ignore it)', async () => {
		let seen: AbortSignal | undefined;
		await classifyWikipedia(
			(_url, init) => {
				seen = init?.signal ?? undefined;
				return new Promise<Response>(() => {});
			},
			{ resolverTimeoutMs: 40 }
		);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(seen?.aborted).toBe(true);
		expect(tuples()).toEqual([tuple('wikipedia', 'classify_summary', 'error', 'timeout')]);
	});
});

describe('a caller cancel in a Wikimedia domain-api stage', () => {
	const hangUntilAborted = createPinAwareFetch(
		(_url: string, init?: RequestInit) =>
			new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () =>
					reject(new DOMException('aborted', 'AbortError'))
				);
			})
	);

	const stageInput = (
		domain: 'wikidata' | 'wikipedia',
		subtype: string,
		meta: Record<string, unknown>,
		url: string,
		signal: AbortSignal
	): PlatformStageInput => ({
		runtime: 'server',
		now: '2026-10-21T00:00:00.000Z',
		domain,
		classification: {
			type: 'url',
			subtype,
			domain,
			meta,
		} as unknown as PlatformStageInput['classification'],
		requestInput: url,
		canonicalUrl: url,
		stageContext: new Map(),
		signal,
		deadlineAtMs: Date.now() + 60_000,
	});

	const cancelled = async (
		run: (signal: AbortSignal) => Promise<unknown> | unknown
	): Promise<Error & { reason?: string }> => {
		const controller = new AbortController();
		const pending = Promise.resolve(run(controller.signal)).catch(
			(error: unknown) => error as Error & { reason?: string }
		);
		await new Promise((resolve) => setTimeout(resolve, 30));
		controller.abort();
		return (await pending) as Error & { reason?: string };
	};

	it('Wikidata says "cancelled", not "timed out"', async () => {
		const adapter = createWikidataEntityDataAdapter(hangUntilAborted);
		const url = 'https://www.wikidata.org/wiki/Q42';
		const error = await cancelled((signal) =>
			adapter(stageInput('wikidata', 'entity', { qid: 'Q42' }, url, signal))
		);
		expect(error).toMatchObject({
			reason: 'adapter_error',
			message: 'Wikidata request was cancelled',
		});
	});

	it('Wikipedia says "cancelled", not "timed out"', async () => {
		const adapter = createWikipediaDomainApiAdapter({ fetch: hangUntilAborted });
		const url = 'https://en.wikipedia.org/wiki/Manon_Rh%C3%A9aume';
		const error = await cancelled((signal) =>
			adapter(stageInput('wikipedia', 'article', { articleTitle: 'Manon_Rheaume' }, url, signal))
		);
		expect(error).toMatchObject({
			reason: 'adapter_error',
			message: 'Wikipedia request was cancelled',
		});
	});
});
