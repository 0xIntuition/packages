import { afterEach, beforeEach, describe, expect, mock, setDefaultTimeout, test } from 'bun:test';
import { resetProviderObserversForTests } from '@0xintuition/pipeline-runtime/provider-observer';
import { createEnrichmentEngine } from '../../engine';
import type { EnrichmentPlugin } from '../../plugins';
import { createMockAtomInput, createMockRequest } from '../../testing';
import { createPinAwareFetch } from './__shared__/http';
import { createMicrodataPlugin } from './microdata';
import { createOpenGraphPlugin } from './opengraph';

/**
 * Parity of the shared page fetch with the two independent fetches it replaced (ENG-16980).
 *
 * Every expectation below was observed on the code BEFORE the shared fetch (commit 1b32e80b7,
 * each plugin run alone through the real engine against the same mocked transport) and is
 * pinned as a literal. A run of both plugins together, with one network fetch, must give each
 * plugin exactly the outcome it gave on its own: artifact, error code, retriable flag, details
 * and message.
 */

// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials; a real lookup would make these tests depend on the network. Nothing is dialled.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

setDefaultTimeout(60_000);
beforeEach(() => resetProviderObserversForTests());
afterEach(() => resetProviderObserversForTests());

const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];
const LD =
	'<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"W"}</script>';
const HTML = { 'content-type': 'text/html' };
const OK_PAGE = `<html><head><title>T</title><meta property="og:title" content="T"></head><body>${LD}</body></html>`;
const redirect = (location: string | null, status = 302) =>
	new Response(null, { status, headers: location ? { location } : {} });

const request = (url: string) =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Thing', name: 'T', url },
		}),
	});

type Respond = (url: string) => Response | Promise<Response>;
type PluginResult =
	| 'artifact'
	| 'nothing'
	| { code: string; retriable: boolean; details?: Record<string, unknown>; message: string };

async function runPlugins(
	name: string,
	respond: Respond,
	plugins: 'both' | 'opengraph' | 'microdata'
) {
	const urls: string[] = [];
	const fetcher = createPinAwareFetch(async (url) => {
		urls.push(url);
		return await respond(url);
	});
	const list: EnrichmentPlugin[] = [];
	if (plugins !== 'microdata')
		list.push(createOpenGraphPlugin({ fetch: fetcher, resolveHostname }));
	if (plugins !== 'opengraph')
		list.push(createMicrodataPlugin({ fetch: fetcher, resolveHostname }));
	const result = await createEnrichmentEngine({
		plugins: list,
		now: () => '2026-01-01T00:00:00.000Z',
	}).enrich(request(`https://${name.toLowerCase()}.example/p`));
	const outcome = (id: string, artifactType: string): PluginResult => {
		const error = result.errors.find((e) => e.pluginId === id);
		if (error) {
			return {
				code: error.code,
				retriable: error.retriable,
				...(error.details ? { details: error.details as Record<string, unknown> } : {}),
				message: error.message.slice(0, 90),
			};
		}
		return result.artifacts.some((a) => a.artifact_type === artifactType) ? 'artifact' : 'nothing';
	};
	return {
		urls,
		opengraph: outcome('opengraph', 'opengraph'),
		microdata: outcome('microdata', 'microdata'),
	};
}

const og = (code: string, retriable: boolean, message: string): PluginResult => ({
	code,
	retriable,
	message,
});
const md = (
	code: string,
	retriable: boolean,
	status: number,
	errorClass: string,
	message: string,
	retryAfterMs?: number
): PluginResult => ({
	code,
	retriable,
	details: { status, ...(retryAfterMs === undefined ? {} : { retryAfterMs }), errorClass },
	message,
});
const httpMd = (
	code: string,
	retriable: boolean,
	status: number,
	retryAfterMs?: number
): PluginResult =>
	md(code, retriable, status, 'provider_http_error', `HTTP ${status} from provider`, retryAfterMs);

// ENG-17017: opengraph's HTTP failures now carry their status and Retry-After in the engine error
// details, as a ProviderHttpError does (before, only the message said so). Code, retriable and
// message are unchanged from the pre-sharing capture.
const ogHttp = (
	code: string,
	status: number,
	message: string,
	retryAfterMs?: number
): PluginResult => md(code, true, status, `http_${status}`, message, retryAfterMs);

let loop = 0;
type Scenario = {
	name: string;
	respond: Respond;
	/** Network fetches of the ONE shared request. */
	fetches: number;
	opengraph: PluginResult;
	microdata: PluginResult;
};
const scenarios: Scenario[] = [
	{
		name: 'ok',
		respond: () => new Response(OK_PAGE, { status: 200, headers: HTML }),
		fetches: 1,
		opengraph: 'artifact',
		microdata: 'artifact',
	},
	{
		name: 's429',
		respond: () => new Response('x', { status: 429, headers: { 'retry-after': '30' } }),
		fetches: 1,
		opengraph: ogHttp('rate_limited', 429, 'OpenGraph fetch retryable HTTP 429.', 30_000),
		microdata: httpMd('rate_limited', true, 429, 30_000),
	},
	{
		name: 's503',
		respond: () => new Response('x', { status: 503, headers: { 'retry-after': '120' } }),
		fetches: 1,
		opengraph: ogHttp('upstream_error', 503, 'OpenGraph fetch retryable HTTP 503.', 120_000),
		microdata: httpMd('upstream_error', true, 503, 120_000),
	},
	{
		name: 's500',
		respond: () => new Response('x', { status: 500 }),
		fetches: 1,
		opengraph: ogHttp('upstream_error', 500, 'OpenGraph fetch retryable HTTP 500.'),
		microdata: httpMd('upstream_error', true, 500),
	},
	{
		name: 's401',
		respond: () => new Response('x', { status: 401 }),
		fetches: 1,
		opengraph: 'nothing',
		microdata: httpMd('auth_failed', false, 401),
	},
	{
		name: 's403',
		respond: () => new Response('x', { status: 403, headers: { 'retry-after': '7' } }),
		fetches: 1,
		opengraph: 'nothing',
		microdata: httpMd('auth_failed', false, 403, 7000),
	},
	{
		name: 's404',
		respond: () => new Response('x', { status: 404 }),
		fetches: 1,
		opengraph: 'nothing',
		microdata: httpMd('upstream_error', false, 404),
	},
	{
		name: 's410',
		respond: () => new Response('x', { status: 410 }),
		fetches: 1,
		opengraph: 'nothing',
		microdata: httpMd('upstream_error', false, 410),
	},
	{
		name: 's418',
		respond: () => new Response('x', { status: 418 }),
		fetches: 1,
		opengraph: 'nothing',
		microdata: httpMd('upstream_error', false, 418),
	},
	{
		name: 'waf202',
		respond: () =>
			new Response('<html>c</html>', {
				status: 202,
				headers: { 'x-amzn-waf-action': 'challenge' },
			}),
		fetches: 1,
		opengraph: 'nothing',
		microdata: 'nothing',
	},
	{
		name: 'redirLoop',
		respond: () => redirect(`https://redirloop.example/n${loop++}`),
		fetches: 6,
		opengraph: og(
			'internal_error',
			false,
			'OpenGraph redirect cap exceeded for redirloop.example.'
		),
		microdata: md('upstream_error', true, 302, 'redirect_exhausted', 'redirect_exhausted'),
	},
	{
		name: 'redirNoLoc',
		respond: () => redirect(null),
		fetches: 1,
		opengraph: 'nothing',
		microdata: md('upstream_error', true, 302, 'redirect_rejected', 'redirect_rejected'),
	},
	{
		name: 'redirPrivate',
		respond: () => redirect('http://127.0.0.1:8080/x'),
		fetches: 1,
		opengraph: 'nothing',
		microdata: md('upstream_error', false, 400, 'target_rejected', 'target_rejected'),
	},
	{
		// Through TMDB to an ordinary page: opengraph follows it all (3 hops), microdata never read a page behind TMDB.
		name: 'redirTmdbThrough',
		respond: (u) =>
			u.includes('/final')
				? new Response(OK_PAGE, { status: 200, headers: HTML })
				: u.includes('themoviedb')
					? redirect('https://redirtmdbthrough.example/final', 301)
					: redirect('https://www.themoviedb.org/movie/1', 301),
		fetches: 3,
		opengraph: 'artifact',
		microdata: md('upstream_error', false, 451, 'embargoed_host', 'embargoed_host'),
	},
	{
		name: 'redirImdb',
		respond: () => redirect('https://www.imdb.com/title/tt0000001/'),
		// Before sharing: one fetch by each plugin; microdata alone was refused before dialling IMDb.
		fetches: 1,
		opengraph: 'nothing',
		microdata: md('upstream_error', false, 451, 'embargoed_host', 'embargoed_host'),
	},
	{
		name: 'redirOk',
		respond: (u) =>
			u.endsWith('/final')
				? new Response(OK_PAGE, { status: 200, headers: HTML })
				: redirect('https://redirok.example/final', 301),
		fetches: 2,
		opengraph: 'artifact',
		microdata: 'artifact',
	},
	// opengraph's head cap (512 KB before </head>) is its own limit: microdata never had it.
	{
		name: 'bigHead600k',
		respond: () =>
			new Response(
				`<html><head><script>${'x'.repeat(600_000)}</script>${LD}</head><body></body></html>`,
				{ status: 200, headers: HTML }
			),
		fetches: 1,
		opengraph: og(
			'internal_error',
			false,
			'OpenGraph response exceeded 524288 bytes before </head>.'
		),
		microdata: 'artifact',
	},
	{
		name: 'noHead600k',
		respond: () =>
			new Response(`${LD}<p>${'y'.repeat(600_000)}</p>`, { status: 200, headers: HTML }),
		fetches: 1,
		opengraph: og(
			'internal_error',
			false,
			'OpenGraph response exceeded 524288 bytes before </head>.'
		),
		microdata: 'artifact',
	},
	{
		name: 'body1_2m',
		respond: () =>
			new Response(
				`<html><head><title>T</title><meta property="og:title" content="T"></head><body>${LD}${'z'.repeat(1_200_000)}</body></html>`,
				{ status: 200, headers: HTML }
			),
		fetches: 1,
		opengraph: 'artifact',
		microdata: md('upstream_error', false, 413, 'response_too_large', 'response_too_large'),
	},
	{
		name: 'jsonCT',
		respond: () =>
			new Response('{"a":1}', { status: 200, headers: { 'content-type': 'application/json' } }),
		fetches: 1,
		opengraph: 'nothing',
		microdata: 'nothing',
	},
	{
		name: 'netErr',
		respond: () => {
			throw new TypeError('fetch failed');
		},
		fetches: 1,
		opengraph: og('upstream_error', true, 'fetch failed'),
		microdata: og('upstream_error', true, 'fetch failed'),
	},
	{
		name: 'ldBodyOnly',
		respond: () =>
			new Response(
				`<html><head><title>T</title><meta property="og:title" content="T"></head><body>${'z'.repeat(100_000)}${LD}</body></html>`,
				{ status: 200, headers: HTML }
			),
		fetches: 1,
		opengraph: 'artifact',
		microdata: 'artifact',
	},
];

describe('both plugins on one shared fetch behave like two independent fetches', () => {
	for (const scenario of scenarios) {
		test(scenario.name, async () => {
			const run = await runPlugins(scenario.name, scenario.respond, 'both');
			expect({
				fetches: run.urls.length,
				opengraph: run.opengraph,
				microdata: run.microdata,
			}).toEqual({
				fetches: scenario.fetches,
				opengraph: scenario.opengraph,
				microdata: scenario.microdata,
			});
		});
	}
});

describe('TMDB stays embargoed for microdata, also behind a redirect', () => {
	const tmdb =
		(target: string): Respond =>
		(url) =>
			url.startsWith(target.slice(0, 22))
				? new Response(OK_PAGE, { status: 200, headers: HTML })
				: redirect(target, 301);
	const embargoed = md('upstream_error', false, 451, 'embargoed_host', 'embargoed_host');

	for (const [name, target] of [
		['redirTmdb', 'https://www.themoviedb.org/movie/1'],
		['redirTmdbOrg', 'https://image.tmdb.org/x'],
	] as const) {
		test(`${name}: with opengraph in the run, opengraph follows (unchanged) and microdata gets 451`, async () => {
			const run = await runPlugins(name, tmdb(target), 'both');
			expect(run.opengraph).toBe('artifact');
			expect(run.microdata).toEqual(embargoed);
			// opengraph's policy allows TMDB pages, so the one shared request did follow it.
			expect(run.urls).toHaveLength(2);
		});

		test(`${name}: microdata alone never dials the embargoed host`, async () => {
			const run = await runPlugins(`${name}-alone`, tmdb(target), 'microdata');
			expect(run.microdata).toEqual(embargoed);
			expect(run.urls).toHaveLength(1);
		});
	}
});

describe('plugins alone keep their pre-sharing outcomes', () => {
	test('opengraph alone on a 503 and microdata alone on a 429 keep their details', async () => {
		const a = await runPlugins(
			'alone503',
			scenarios.find((s) => s.name === 's503')!.respond,
			'opengraph'
		);
		expect(a.opengraph).toEqual(
			ogHttp('upstream_error', 503, 'OpenGraph fetch retryable HTTP 503.', 120_000)
		);
		const b = await runPlugins(
			'alone429',
			scenarios.find((s) => s.name === 's429')!.respond,
			'microdata'
		);
		expect(b.microdata).toEqual(httpMd('rate_limited', true, 429, 30_000));
	});

	test('microdata alone on a head past 512 KB still gets its artifact', async () => {
		const s = scenarios.find((x) => x.name === 'bigHead600k')!;
		expect((await runPlugins('alonebig', s.respond, 'microdata')).microdata).toBe('artifact');
	});
});
