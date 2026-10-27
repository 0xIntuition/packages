import { ProviderHttpError } from '@0xintuition/atom-enrichment/provider-fetch';
import { classifyTmdbError } from '@0xintuition/atom-enrichment/tmdb-request-observer';
import { buildTmdbFindEndpoint } from '@0xintuition/pipeline-runtime';
import { readBoundedResponseText } from '@0xintuition/pipeline-runtime/bounded-text';
import { observeProviderRequest } from '@0xintuition/pipeline-runtime/provider-request-observation';
import type { ResolverAtom } from '../../plugins';
import { normalizeWhitespace } from '../shared/domain-html/document';
import {
	type DomainHtmlFetchLike,
	type DomainHtmlResolveHostname,
	fetchJsonDocumentResult,
	resolveDomainHtmlFetch,
} from '../shared/domain-html/fetch';
import { buildIdentityResolverAtom } from '../shared/domain-html/identity';
import { toRecordMaybe, toStringMaybe } from '../shared/helpers';
import {
	createPlatformStageOutcome,
	PLATFORM_STAGE_MISS,
	type PlatformStageAdapter,
} from '../shared/platform';

export type ImdbDomainHtmlAdapterOptions = {
	apiKey?: string;
	fetch?: DomainHtmlFetchLike;
	resolveHostname?: DomainHtmlResolveHostname;
	/** The local `/find` timer, a provider timeout when it fires. Default 3000. */
	findTimeoutMs?: number;
};
export type ImdbDomainHtmlAdapter = PlatformStageAdapter;
type BridgeStatus = { status: 'hit' | 'miss' | 'ambiguous' | 'unavailable'; hits: number };
type FindResult = BridgeStatus & { record?: Record<string, unknown>; mediaType?: 'movie' | 'tv' };

/** The historical adapter slot now uses catalog APIs exclusively. */
export function createImdbDomainHtmlAdapter(
	options: ImdbDomainHtmlAdapterOptions = {}
): ImdbDomainHtmlAdapter {
	const apiKey = options.apiKey?.trim();
	return async ({ runtime, domain, classification, canonicalUrl, signal, deadlineAtMs }) => {
		if (runtime !== 'server' || domain !== 'imdb') return PLATFORM_STAGE_MISS;
		const person = classification.subtype === 'person';
		const entityId = toStringMaybe(classification.meta[person ? 'personId' : 'titleId']);
		if (!entityId || !(person ? /^nm\d+$/ : /^tt\d+$/).test(entityId)) return PLATFORM_STAGE_MISS;
		const bridge: FindResult = person
			? { status: 'miss', hits: 0 }
			: await findTitle(
					entityId,
					apiKey,
					options.fetch,
					signal,
					deadlineAtMs,
					options.findTimeoutMs
				);
		if (bridge.status === 'hit' && bridge.record && bridge.mediaType) {
			return buildTmdbAtom(bridge.record, bridge.mediaType, entityId, canonicalUrl);
		}
		const suggestion = await fetchJsonDocumentResult<unknown>(
			resolveDomainHtmlFetch(options.fetch),
			{
				url: `https://v2.sg.media-imdb.com/suggestion/${person ? 'n' : 't'}/${entityId}.json`,
				resolveHostname: options.resolveHostname,
				signal,
			}
		);
		const records = suggestion.ok ? toRecordMaybe(suggestion.value)?.d : undefined;
		const record = Array.isArray(records)
			? records.map(toRecordMaybe).find((entry) => entry?.id === entityId)
			: undefined;
		const title = normalizeWhitespace(toStringMaybe(record?.l));
		if (!title) {
			// Keep the bridge diagnosis on classification as well as successful atoms.
			classification.meta.imdbBridge = bridgeSummary(bridge);
			return createPlatformStageOutcome(
				null,
				[new Error(`imdb_bridge:${bridge.status}:${bridge.hits}:title_unavailable`)],
				{ terminal: true, availability: 'unavailable', reason: 'adapter_null' }
			);
		}
		const schemaType = person
			? 'Person'
			: /^(tvseries|tvmini-series|tvminiseries|tv)$/i.test(toStringMaybe(record?.qid) ?? '')
				? 'TVSeries'
				: 'Movie';
		const atom = buildIdentityResolverAtom({
			schemaType,
			category: person ? 'person' : 'thing',
			title,
			canonicalId: `imdb:${person ? 'name' : 'title'}:${entityId}`,
			canonicalUrl,
			pluginId: 'imdb',
			provider: 'imdb-suggestion',
			fields: person ? {} : { identifier: `int:imdb:${entityId}` },
		});
		return {
			...atom,
			hints: { identifiers: { imdbId: entityId } },
			metadata: { ...atom.metadata, imdbBridge: bridgeSummary(bridge) },
		};
	};
}

function bridgeSummary(result: BridgeStatus): BridgeStatus {
	return { status: result.status, hits: result.hits };
}

async function findTitle(
	imdbId: string,
	apiKey: string | undefined,
	injectedFetch: DomainHtmlFetchLike | undefined,
	parentSignal?: AbortSignal,
	deadlineAtMs?: number,
	findTimeoutMs = 3000
): Promise<FindResult> {
	if (!apiKey) return { status: 'unavailable', hits: 0 };
	const timeout = AbortSignal.timeout(findTimeoutMs);
	const signal = parentSignal ? AbortSignal.any([parentSignal, timeout]) : timeout;
	// An answer TMDB gave but we cannot use keeps its hit count on the bridge summary.
	let unusableHits = 0;
	try {
		// 2026-09-01 licence: identity-only; no images, no page source. Never follow redirects.
		const fetcher = injectedFetch ?? globalThis.fetch;
		// Observed as `tmdb|find`. The context carries the stage signal and deadline, not the local
		// 3 s timer: the timer firing is a provider timeout, a caller cancelling records nothing.
		return await observeProviderRequest<'tmdb', FindResult>(
			{
				provider: 'tmdb',
				operation: 'find',
				context: { signal: parentSignal, deadlineAtMs },
				classifyError: classifyTmdbError,
				classifyResult: (result) => (result.hits === 0 ? 'miss' : 'hit'),
			},
			async () => {
				const response = await fetcher(buildTmdbFindEndpoint(imdbId, apiKey), {
					redirect: 'error',
					signal,
				});
				if (!response.ok) throw new ProviderHttpError({ status: response.status });
				const body = await readBoundedResponseText(response, { maxBytes: 1024 * 1024, signal });
				if (body.ok === false) {
					throw new ProviderHttpError({
						status: 502,
						errorClass: body.reason === 'body_limit' ? 'response_too_large' : 'body_read_failure',
					});
				}
				const payload = toRecordMaybe(JSON.parse(body.value));
				if (!Array.isArray(payload?.movie_results) || !Array.isArray(payload?.tv_results)) {
					throw new ProviderHttpError({ status: 502, errorClass: 'invalid_json' });
				}
				const hits = payload.movie_results.length + payload.tv_results.length;
				if (hits !== 1) return { status: hits === 0 ? 'miss' : 'ambiguous', hits };
				const mediaType = payload.movie_results.length ? 'movie' : 'tv';
				const record = toRecordMaybe(
					(mediaType === 'movie' ? payload.movie_results : payload.tv_results)[0]
				);
				const title = normalizeWhitespace(
					toStringMaybe(record?.[mediaType === 'movie' ? 'title' : 'name'])
				);
				if (
					!record ||
					typeof record.id !== 'number' ||
					!Number.isSafeInteger(record.id) ||
					record.id <= 0 ||
					!title
				) {
					unusableHits = hits;
					throw new ProviderHttpError({ status: 502, errorClass: 'invalid_json' });
				}
				return { status: 'hit', hits, mediaType, record };
			}
		);
	} catch {
		return { status: 'unavailable', hits: unusableHits };
	}
}

function buildTmdbAtom(
	record: Record<string, unknown>,
	mediaType: 'movie' | 'tv',
	imdbId: string,
	canonicalUrl: string
): ResolverAtom {
	const tmdbId = String(record.id);
	const canonicalId = `tmdb:${mediaType}:${tmdbId}`;
	const sameAs = [canonicalUrl, `https://www.themoviedb.org/${mediaType}/${tmdbId}`];
	const title = normalizeWhitespace(
		toStringMaybe(record[mediaType === 'movie' ? 'title' : 'name'])
	)!;
	const date = toStringMaybe(record[mediaType === 'movie' ? 'release_date' : 'first_air_date']);
	const atom = buildIdentityResolverAtom({
		schemaType: mediaType === 'movie' ? 'Movie' : 'TVSeries',
		category: 'thing',
		title,
		canonicalId,
		canonicalUrl,
		sameAs,
		pluginId: 'imdb',
		provider: 'imdb-tmdb',
		fields: {
			identifier: `int:${canonicalId}`,
			tmdbId,
			mediaType,
			imdbId,
			...(date ? { datePublished: date } : {}),
		},
	});
	return {
		...atom,
		hints: {
			identifiers: { tmdbId, mediaType, imdbId },
			providerCanonicalIds: [`imdb:title:${imdbId}`],
		},
		metadata: {
			...atom.metadata,
			identityBridgeEligible: true,
			imdbBridge: { status: 'hit', hits: 1 },
		},
	};
}
