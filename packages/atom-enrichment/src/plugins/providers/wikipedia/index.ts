import {
	defineEnrichmentPlugin,
	type EnrichmentPlugin,
	type EnrichmentPluginContext,
} from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import type { PinAwareFetch } from '../__shared__/http';
import { isWikimediaMiss } from '../__shared__/provider-fetch';
import {
	getRequestName,
	getRequestUrl,
	isSynthesizedProviderPlaceholderTitle,
	parseWikipediaTitleFromUrl,
} from '../__shared__/request';
import { fetchWikidataEntity, wikidataTypeAgreement } from '../__shared__/wikidata-type';
import {
	createWikimediaClient,
	type WikimediaClientOptions,
	wikimediaJson,
} from '../__shared__/wikimedia';
import { type WikipediaSummaryResponse, wikipediaSummaryResponseSchema } from './external';
import { wikipediaDataSchema } from './schema';

type CreateWikipediaPluginOptions = WikimediaClientOptions & {
	fetch?: PinAwareFetch;
	priority?: number;
	TTL?: number;
	language?: string;
};

export function createWikipediaPlugin(
	options: CreateWikipediaPluginOptions = {}
): EnrichmentPlugin {
	const client = createWikimediaClient(options.fetch, options);
	const language = options.language ?? 'en';

	/**
	 * The type-agreement lookup is optional enrichment: when it fails (already recorded as
	 * `wikidata|entity`), the summary artifact is kept with title-only identity strength. Only the
	 * run ending (abort or deadline) is not swallowed.
	 */
	async function fetchOptionalEntity(entityId: string, ctx: EnrichmentPluginContext) {
		try {
			return await fetchWikidataEntity(client, entityId, ctx);
		} catch (error) {
			ctx.signal.throwIfAborted();
			ctx.logger?.warn('Wikipedia secondary Wikidata lookup failed', {
				entityId,
				errorClass: error instanceof Error ? error.name : 'unknown',
			});
			return undefined;
		}
	}

	return defineEnrichmentPlugin({
		id: 'wikipedia',
		version: '1.1.0',
		runtime: 'universal',
		artifactTypes: ['wikipedia'],
		priority: options.priority ?? 30,
		TTL: options.TTL ?? 43_200,

		observability: {
			provider: 'wikipedia',
			// A cached run stands in for the summary lookup its request selects.
			cacheOperations: (request) => (supportsRequest(request) ? ['summary'] : []),
		},

		supports: supportsRequest,

		async enrich(request, ctx) {
			const title = resolveWikipediaTitle(request);
			if (!title || isSynthesizedProviderPlaceholderTitle(request, title)) {
				return [];
			}

			const endpoint = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
			let payload: WikipediaSummaryResponse;
			try {
				payload = await wikimediaJson({
					client,
					provider: 'wikipedia',
					operation: 'summary',
					url: endpoint,
					schema: wikipediaSummaryResponseSchema,
					context: ctx,
				});
			} catch (error) {
				// A 404 was recorded as a miss; the engine must see "no page", not a provider error.
				if (isWikimediaMiss(error)) return [];
				throw error;
			}

			const requestUrl = getRequestUrl(request);
			const titleFromUrl = requestUrl ? parseWikipediaTitleFromUrl(requestUrl) : undefined;
			let titleOnly = false;
			if (!titleFromUrl) {
				const qid = payload.wikibase_item;
				const entity =
					qid && /^Q\d+$/i.test(qid)
						? await fetchOptionalEntity(qid.toUpperCase(), ctx)
						: undefined;
				const agreement = wikidataTypeAgreement(entity?.claims, request.input.jsonLd['@type']);
				if (agreement === 'mismatch') return [];
				titleOnly = agreement === 'unknown';
			}

			const pageUrl =
				payload.content_urls?.desktop?.page ??
				payload.content_urls?.mobile?.page ??
				`https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;

			return [
				{
					artifact_type: 'wikipedia',
					data: wikipediaDataSchema.parse({
						title: payload.title ?? title,
						description: toOptionalString(payload.description),
						extract: payload.extract ?? '',
						extractHtml: toOptionalString(payload.extract_html),
						thumbnailUrl: payload.thumbnail?.source,
						pageUrl,
						pageId: payload.pageid,
						language: payload.lang ?? language,
						lastModified: payload.timestamp,
						wikibaseItem: toOptionalString(payload.wikibase_item),
					}),
					meta: {
						pluginId: 'wikipedia',
						...(titleOnly ? { identityStrength: 'title' as const } : {}),
						provider: 'wikipedia',
						fetchedAt: ctx.now(),
						sourceUrl: pageUrl,
					},
				},
			];
		},
	});
}

function supportsRequest(request: EnrichmentRequest): boolean {
	const title = resolveWikipediaTitle(request);
	return !!title && !isSynthesizedProviderPlaceholderTitle(request, title);
}

function resolveWikipediaTitle(request: EnrichmentRequest): string | undefined {
	const requestUrl = getRequestUrl(request);
	if (requestUrl) {
		const titleFromUrl = parseWikipediaTitleFromUrl(requestUrl);
		if (titleFromUrl) {
			return titleFromUrl;
		}
	}

	return getRequestName(request);
}

function toOptionalString(value: string | null | undefined): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}
