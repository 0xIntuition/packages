import {
	isAdmissibleMaterializedImageWithDns,
	isAllowedOpenGraphPageSource,
	type ResolvePublicHostname,
} from '../../../image-policy';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import type { FetchLike } from '../__shared__/http';
import { pageRefusal } from '../__shared__/page-observer';
import { getRequestUrl } from '../__shared__/request';
import { loadSharedPage } from '../__shared__/shared-page';
import {
	createHeadSizeLimitError,
	DEFAULT_OPENGRAPH_TIMEOUT_MS,
	normalizeFetchError,
} from './fetch';

// Google Maps pages serve the product's own boilerplate OpenGraph ("Google
// Maps — Find local businesses…"), never metadata about the place itself —
// the places plugin owns that URL family.
function isGoogleMapsUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
		if (host === 'maps.app.goo.gl' || host === 'goo.gl' || host === 'maps.google.com') {
			return true;
		}
		return (
			(host === 'google.com' || host.endsWith('.google.com')) && parsed.pathname.startsWith('/maps')
		);
	} catch {
		return false;
	}
}

type CreateOpenGraphPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	resolveHostname?: ResolvePublicHostname;
	/** This plugin's own timer on the page fetch; defaults to 10 s. */
	timeoutMs?: number;
	TTL?: number;
};

export function createOpenGraphPlugin(
	options: CreateOpenGraphPluginOptions = {}
): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);

	return defineEnrichmentPlugin({
		id: 'opengraph',
		version: '1.0.0',
		runtime: 'universal',
		artifactTypes: ['opengraph'],
		priority: options.priority ?? 10,
		TTL: options.TTL ?? 2_592_000,

		supports(request: EnrichmentRequest) {
			const url = getRequestUrl(request);
			return (
				!!url &&
				!isGoogleMapsUrl(url) &&
				isAllowedOpenGraphPageSource(url, { genericUserPasted: true })
			);
		},

		async enrich(request, ctx) {
			const url = getRequestUrl(request);
			if (!url) {
				return [];
			}

			// Shared with the other plugins of this run (microdata); see `loadSharedPage`.
			const { result, page } = await loadSharedPage({
				url,
				pages: ctx.pages,
				fetch: fetcher,
				resolveHostname: options.resolveHostname,
				signal: ctx.signal,
				deadlineAtMs: ctx.deadlineAtMs,
				allowLoopbackFixtures: ctx.network?.allowLoopbackFixtures,
				consumer: 'opengraph',
				timeoutMs: options.timeoutMs ?? DEFAULT_OPENGRAPH_TIMEOUT_MS,
				mapError: normalizeFetchError,
			});
			if (result.headCapExceeded) {
				// The shared request kept the page for microdata; the head is still opengraph's cap.
				page.finish({ usable: false, headCapExceeded: true });
				throw createHeadSizeLimitError();
			}
			page.finish({
				usable: result.status === 'fetched',
				refusal: pageRefusal(result),
				deadUrl: result.status === 'dead_url',
			});
			if (result.status !== 'fetched') {
				return [];
			}
			const metadata = result.metadata;
			const allTags = metadata.allTags ?? {};
			const audioUrl = readFirstMetadataValue(metadata, [
				'og:audio:secure_url',
				'og:audio:url',
				'og:audio',
				'twitter:player:stream',
				'music:preview_url:url',
				'music:preview_url',
			]);
			const audioType = readFirstMetadataValue(metadata, [
				'og:audio:type',
				'twitter:player:stream:content_type',
				'music:preview_url:type',
			]);
			const imageIsAdmissible = await isAdmissibleMaterializedImageWithDns(
				{
					imageUrl: metadata.image,
					pageAuthorization: result.pageAuthorization,
					pageSourceUrl: result.finalUrl,
				},
				options.resolveHostname
			);

			return [
				{
					artifact_type: 'opengraph',
					data: {
						title: metadata.title,
						description: metadata.description,
						...(imageIsAdmissible ? { image: metadata.image } : {}),
						url: metadata.url || result.finalUrl,
						siteName: allTags['og:site_name'],
						type: metadata.type,
						locale: allTags['og:locale'],
						audio: audioUrl,
						audioUrl,
						audioType,
					},
					meta: {
						pluginId: 'opengraph',
						provider: 'website',
						fetchedAt: ctx.now(),
						sourceUrl: result.finalUrl,
						imagePolicy: result.pageAuthorization,
					},
				},
			];
		},
	});
}

function readFirstMetadataValue(
	metadata: { allTags?: Record<string, string> },
	keys: readonly string[]
): string | undefined {
	const tags = metadata.allTags ?? {};
	for (const key of keys) {
		const value = tags[key];
		if (value && value.trim().length > 0) {
			return value.trim();
		}
	}

	return undefined;
}
