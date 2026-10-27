import type { ProviderOperationOf } from '@0xintuition/pipeline-runtime/provider-registry';
import { observeProviderRequest } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';
import { getRequestUrl } from '../__shared__/request';
import { oembedResponseSchema } from './external';
import { oembedDataSchema } from './schema';

type OEmbedProvider = {
	id: string;
	matcher: RegExp;
	oembedEndpoint: string;
};

type CreateOEmbedPluginOptions = {
	fetch?: FetchLike;
	providers?: OEmbedProvider[];
	priority?: number;
	TTL?: number;
};

type OEmbedResponse = {
	type: 'photo' | 'video' | 'link' | 'rich';
	title?: string;
	author_name?: string;
	author_url?: string;
	provider_name?: string;
	provider_url?: string;
	thumbnail_url?: string;
	thumbnail_width?: number;
	thumbnail_height?: number;
	html?: string;
	width?: number;
	height?: number;
	url?: string;
};

/** A built-in provider: its id is a registered `oembed` operation, so a bad id is a compile error. */
type BuiltInOEmbedProvider = OEmbedProvider & { id: ProviderOperationOf<'oembed'> };

const defaultProviders: BuiltInOEmbedProvider[] = [
	{
		id: 'youtube',
		matcher: /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i,
		oembedEndpoint: 'https://www.youtube.com/oembed',
	},
	{
		id: 'vimeo',
		matcher: /^https?:\/\/(?:www\.)?vimeo\.com\//i,
		oembedEndpoint: 'https://vimeo.com/api/oembed.json',
	},
	{
		id: 'twitter',
		matcher: /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i,
		// publish.twitter.com/oembed always answers 301 to this host (observed live): dial it directly.
		oembedEndpoint: 'https://publish.x.com/oembed',
	},
];

const OPERATION_BY_ENDPOINT: ReadonlyMap<string, ProviderOperationOf<'oembed'>> = new Map(
	defaultProviders.map((provider) => [provider.oembedEndpoint, provider.id])
);

/**
 * The metric operation of a provider: decided by the endpoint it dials, matched against the fixed
 * built-in endpoints, never by `options.providers` ids (caller-supplied, so a custom provider may
 * call itself `vimeo`). A provider that dials any other endpoint is not observed.
 */
function observedOperation(provider: OEmbedProvider): ProviderOperationOf<'oembed'> | undefined {
	return OPERATION_BY_ENDPOINT.get(provider.oembedEndpoint);
}

/**
 * 401, 403, 404 and 410 are what the endpoints answer for a private, deleted or non-embeddable
 * item (YouTube and Vimeo 404 a missing id, observed live): nothing for this id, so a `miss`.
 * The endpoints are unauthenticated, so none of these is an auth failure.
 */
function classifyOEmbedError(error: unknown) {
	return classifyProviderRequestError(error, {
		statusOutcomes: { 401: 'miss', 403: 'miss', 404: 'miss', 410: 'miss' },
	});
}

export function createOEmbedPlugin(options: CreateOEmbedPluginOptions = {}): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const providers = options.providers ?? defaultProviders;

	return defineEnrichmentPlugin({
		id: 'oembed',
		version: '1.0.0',
		runtime: 'universal',
		artifactTypes: ['oembed'],
		priority: options.priority ?? 20,
		TTL: options.TTL ?? 3_600,

		observability: {
			provider: 'oembed',
			// A cached run stands in for the one lookup its URL selects.
			cacheOperations(request) {
				const url = getRequestUrl(request);
				const provider = url ? resolveProvider(url, providers) : undefined;
				const operation = provider ? observedOperation(provider) : undefined;
				return operation ? [operation] : [];
			},
		},

		supports(request: EnrichmentRequest) {
			const url = getRequestUrl(request);
			if (!url) {
				return false;
			}

			return !!resolveProvider(url, providers);
		},

		async enrich(request, ctx) {
			const url = getRequestUrl(request);
			if (!url) {
				return [];
			}

			const provider = resolveProvider(url, providers);
			if (!provider) {
				return [];
			}

			const endpoint = new URL(provider.oembedEndpoint);
			endpoint.searchParams.set('url', url);
			endpoint.searchParams.set('format', 'json');

			const fetchPayload = () =>
				fetchJsonWithSchema(fetcher, endpoint.toString(), oembedResponseSchema, {
					signal: ctx.signal,
				});
			const operation = observedOperation(provider);
			const payload = operation
				? await observeProviderRequest(
						{
							provider: 'oembed',
							operation,
							context: { signal: ctx.signal, deadlineAtMs: ctx.deadlineAtMs },
							classifyError: classifyOEmbedError,
						},
						fetchPayload
					)
				: await fetchPayload();

			return [
				{
					artifact_type: 'oembed',
					data: oembedDataSchema.parse({
						type: payload.type,
						title: payload.title,
						authorName: payload.author_name,
						authorUrl: payload.author_url,
						providerName: payload.provider_name,
						providerUrl: payload.provider_url,
						thumbnailUrl: payload.thumbnail_url,
						thumbnailWidth: toOptionalNumber(payload.thumbnail_width),
						thumbnailHeight: toOptionalNumber(payload.thumbnail_height),
						html: payload.html,
						width: toOptionalNumber(payload.width),
						height: toOptionalNumber(payload.height),
						url: payload.url,
					}),
					meta: {
						pluginId: 'oembed',
						provider: provider.id,
						fetchedAt: ctx.now(),
						sourceUrl: url,
					},
				},
			];
		},
	});
}

function resolveProvider(url: string, providers: OEmbedProvider[]): OEmbedProvider | undefined {
	return providers.find((provider) => provider.matcher.test(url));
}

function toOptionalNumber(value: number | string | null | undefined): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
}
