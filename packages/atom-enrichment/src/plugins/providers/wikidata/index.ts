import { pickWikidataLabel } from '@0xintuition/iid-ladder';
import type { ObservedRequestContext } from '@0xintuition/pipeline-runtime/provider-request-observation';
import {
	isUnsentSlotRefusal,
	RequestSlotTimeoutError,
} from '@0xintuition/pipeline-runtime/request-slot';
import {
	defineEnrichmentPlugin,
	type EnrichmentPlugin,
	type EnrichmentPluginLogger,
} from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import type { PinAwareFetch } from '../__shared__/http';
import {
	classifyWikimediaError,
	isWikimediaMiss,
	WIKIMEDIA_MAXLAG_SECONDS,
} from '../__shared__/provider-fetch';
import {
	getIdentifier,
	getRequestName,
	getRequestUrl,
	isSynthesizedProviderPlaceholderTitle,
} from '../__shared__/request';
import { fetchWikidataEntity, wikidataTypeAgreement } from '../__shared__/wikidata-type';
import {
	createWikimediaClient,
	type WikimediaClient,
	type WikimediaClientOptions,
	wikimediaJson,
} from '../__shared__/wikimedia';
import { wikidataSearchResponseSchema } from './external';
import { wikidataDataSchema } from './schema';

type CreateWikidataPluginOptions = WikimediaClientOptions & {
	fetch?: PinAwareFetch;
	priority?: number;
	TTL?: number;
	language?: string;
};

type WikidataSearchResponse = {
	search?: Array<{ id?: string }>;
};

type WikidataMonolingualValue = {
	value?: string;
};

type WikidataClaim = {
	mainsnak?: {
		datavalue?: {
			value?: unknown;
		};
	};
};

type WikidataEntity = {
	id?: string;
	labels?: Record<string, WikidataMonolingualValue>;
	descriptions?: Record<string, WikidataMonolingualValue>;
	aliases?: Record<string, WikidataMonolingualValue[]>;
	claims?: Record<string, WikidataClaim[]>;
	sitelinks?: Record<string, { site?: string; title?: string; url?: string }>;
};

type WikidataEntityResponse = {
	entities?: Record<string, WikidataEntity>;
};

const wikidataEntityIdPattern = /^Q\d+$/i;

export function createWikidataPlugin(options: CreateWikidataPluginOptions = {}): EnrichmentPlugin {
	const client = createWikimediaClient(options.fetch, options);
	const language = options.language ?? 'en';

	return defineEnrichmentPlugin({
		id: 'wikidata',
		version: '1.1.0',
		runtime: 'server',
		artifactTypes: ['wikidata'],
		priority: options.priority ?? 35,
		TTL: options.TTL ?? 43_200,

		observability: {
			provider: 'wikidata',
			// A cached run stands in for the one lookup its request selects: the entity fetch for a
			// request that carries an entity id, the title search otherwise.
			cacheOperations(request) {
				if (!supportsRequest(request)) return [];
				return [resolveWikidataEntityId(request) ? 'entity' : 'search'];
			},
		},

		supports: supportsRequest,

		async enrich(request, ctx) {
			let titleOnly = false;
			let entityId = resolveWikidataEntityId(request);
			let entity = entityId ? await fetchWikidataEntity(client, entityId, ctx) : undefined;
			if (!entityId) {
				const name = getRequestName(request);
				if (!name || isSynthesizedProviderPlaceholderTitle(request, name)) {
					return [];
				}

				const candidate = await searchEntityId(
					client,
					name,
					language,
					ctx,
					request.input.jsonLd['@type'],
					ctx.logger
				);
				entityId = candidate?.entityId;
				entity = candidate?.entity;
				titleOnly = candidate?.titleOnly ?? false;
				if (!entityId) {
					return [];
				}
			}

			if (!entity) {
				return [];
			}

			const label = pickWikidataLabel(entity.labels, language);
			if (!label) {
				return [];
			}

			const description = pickWikidataLabel(entity.descriptions, language);
			const aliases = pickAliases(entity.aliases, [language, 'en']);
			const sitelinks = normalizeSitelinks(entity.sitelinks);
			const sourceUrl = sitelinks?.enwiki ?? `https://www.wikidata.org/wiki/${entityId}`;

			return [
				{
					artifact_type: 'wikidata',
					data: wikidataDataSchema.parse({
						entityId,
						label,
						description,
						aliases,
						claims: entity.claims,
						sitelinks,
						instanceOf: extractInstanceOf(entity.claims),
					}),
					meta: {
						pluginId: 'wikidata',
						...(titleOnly ? { identityStrength: 'title' as const } : {}),
						provider: 'wikidata',
						fetchedAt: ctx.now(),
						sourceUrl,
					},
				},
			];
		},
	});
}

function supportsRequest(request: EnrichmentRequest): boolean {
	const name = getRequestName(request);
	return (
		!!resolveWikidataEntityId(request) ||
		(!!name && !isSynthesizedProviderPlaceholderTitle(request, name))
	);
}

function resolveWikidataEntityId(request: EnrichmentRequest): string | undefined {
	const identifier = getIdentifier(request, 'wikidata', 'wikidataId', 'entityId');
	if (identifier && wikidataEntityIdPattern.test(identifier)) {
		return identifier.toUpperCase();
	}

	const url = getRequestUrl(request);
	if (url) {
		const fromUrl = parseWikidataEntityIdFromUrl(url);
		if (fromUrl) {
			return fromUrl;
		}
	}

	const name = getRequestName(request);
	if (name && wikidataEntityIdPattern.test(name)) {
		return name.toUpperCase();
	}

	return undefined;
}

async function searchEntityId(
	client: WikimediaClient,
	name: string,
	language: string,
	context: ObservedRequestContext & { signal: AbortSignal },
	expectedType: unknown,
	logger?: EnrichmentPluginLogger
) {
	const { signal } = context;
	signal.throwIfAborted();
	// `maxlag` makes Wikimedia refuse the read (HTTP 200, `Retry-After`) while replication lags,
	// instead of adding load; EntityData ignores it (live check), so only the action API gets it.
	const searchUrl =
		`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&limit=5` +
		`&maxlag=${WIKIMEDIA_MAXLAG_SECONDS}` +
		`&language=${encodeURIComponent(language)}` +
		`&search=${encodeURIComponent(name)}`;
	const payload = await searchWikidata(client, searchUrl, context);
	if (!payload) return undefined;

	let firstUnknown: { entityId: string; entity: WikidataEntity; titleOnly: boolean } | undefined;
	let firstError: unknown;
	let fetchedCandidate = false;
	for (const candidate of (payload.search ?? []).slice(0, 5)) {
		if (!candidate.id || !wikidataEntityIdPattern.test(candidate.id)) continue;
		const entityId = candidate.id.toUpperCase();
		signal.throwIfAborted();
		let entity: Awaited<ReturnType<typeof fetchWikidataEntity>>;
		try {
			entity = await fetchWikidataEntity(client, entityId, context);
			signal.throwIfAborted();
			fetchedCandidate = true;
		} catch (error) {
			signal.throwIfAborted();
			// A throttle ends the loop: Wikimedia asked us to back off, so no more candidates are
			// fetched. So does our own pacing slot refusing the request (`budget_exhausted`): the next
			// candidate would be refused the same way, and each refusal is a recorded series. What we
			// already hold is returned; otherwise the error is rethrown. A throttle reaches the engine
			// as `rate_limited` with its `retryAfterMs`. A slot refusal ends the loop but not the lookup:
			// the engine maps it to a retriable `internal_error` with `details.errorClass:
			// 'budget_exhausted'` and a `retryAfterMs` (ENG-17116), and the worker requeues the stage.
			if (endsCandidateLoop(error) || classifyWikimediaError(error).reason === 'rate_limited') {
				if (firstUnknown) return firstUnknown;
				throw error;
			}
			firstError ??= error;
			logger?.warn('Wikidata candidate fetch failed', {
				entityId,
				errorClass: error instanceof Error ? error.name : 'unknown',
			});
			continue;
		}
		if (!entity) continue;
		const agreement = wikidataTypeAgreement(entity.claims, expectedType);
		if (agreement === 'agree') return { entityId, entity, titleOnly: false };
		if (agreement === 'unknown' && !firstUnknown)
			firstUnknown = { entityId, entity, titleOnly: true };
	}
	signal.throwIfAborted();
	if (!firstUnknown && !fetchedCandidate && firstError) throw firstError;
	return firstUnknown;
}

/**
 * Whether the candidate loop must stop: our own pacing slot refused the request (`slotRefusalOf`:
 * queue full, cannot start before the deadline, or the deadline passed while it queued), or the
 * deadline passed after the dial (`RequestSlotTimeoutError`; `signal.throwIfAborted()` normally ends
 * the run first). Either way the next candidate would meet the same slot (ENG-17085).
 */
function endsCandidateLoop(error: unknown): boolean {
	return isUnsentSlotRefusal(error) || error instanceof RequestSlotTimeoutError;
}

/** The title search; a 404 (recorded as a miss) is "no candidates", not a failed run. */
async function searchWikidata(
	client: WikimediaClient,
	searchUrl: string,
	context: ObservedRequestContext
): Promise<WikidataSearchResponse | undefined> {
	try {
		return await wikimediaJson({
			client,
			provider: 'wikidata',
			operation: 'search',
			url: searchUrl,
			schema: wikidataSearchResponseSchema,
			context,
			actionApi: true,
			classifyResult: (value) => ((value.search ?? []).length > 0 ? 'hit' : 'miss'),
		});
	} catch (error) {
		if (isWikimediaMiss(error)) return undefined;
		throw error;
	}
}

function parseWikidataEntityIdFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.includes('wikidata.org')) {
			return undefined;
		}

		const match = parsed.pathname.match(/\/wiki\/(Q\d+)/i);
		if (!match?.[1]) {
			return undefined;
		}

		return match[1].toUpperCase();
	} catch {
		return undefined;
	}
}

function pickAliases(
	aliases: Record<string, WikidataMonolingualValue[]> | undefined,
	preferredLocales: string[]
): string[] | undefined {
	if (!aliases) {
		return undefined;
	}

	for (const locale of preferredLocales) {
		const values = aliases[locale]
			?.map((entry) => entry.value)
			.filter((value): value is string => typeof value === 'string' && value.length > 0);
		if (values && values.length > 0) {
			return values;
		}
	}

	return undefined;
}

function normalizeSitelinks(
	sitelinks: Record<string, { site?: string; title?: string; url?: string }> | undefined
): Record<string, string> | undefined {
	if (!sitelinks) {
		return undefined;
	}

	const normalized: Record<string, string> = {};
	for (const [siteKey, value] of Object.entries(sitelinks)) {
		if (typeof value.url === 'string' && value.url.length > 0) {
			normalized[siteKey] = value.url;
			continue;
		}

		if (!value.site || !value.title) {
			continue;
		}

		if (value.site.endsWith('wiki') && value.site.length > 4) {
			const locale = value.site.slice(0, -4);
			normalized[siteKey] =
				`https://${locale}.wikipedia.org/wiki/${encodeURIComponent(value.title.replace(/\s+/g, '_'))}`;
		}
	}

	return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function extractInstanceOf(
	claims: Record<string, WikidataClaim[]> | undefined
): string[] | undefined {
	const statements = claims?.P31;
	if (!statements) {
		return undefined;
	}

	const values = statements
		.map((statement) => extractEntityId(statement.mainsnak?.datavalue?.value))
		.filter((value): value is string => typeof value === 'string' && value.length > 0);

	return values.length > 0 ? values : undefined;
}

function extractEntityId(value: unknown): string | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}

	const candidate = (value as { id?: unknown }).id;
	return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
}
