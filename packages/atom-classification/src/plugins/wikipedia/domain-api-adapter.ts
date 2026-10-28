import {
	fetchProviderJson,
	isWikimediaMiss,
	type PinAwareFetch,
	WIKIMEDIA_STATUS_OUTCOMES,
	WIKIMEDIA_USER_AGENT,
} from '@0xintuition/atom-enrichment/provider-fetch';
import { z } from 'zod/v4';
import { toRecordMaybe, toStringMaybe } from '../shared/helpers';
import { PLATFORM_STAGE_MISS, type PlatformStageAdapter } from '../shared/platform';
import { toProviderStageDiagnostic } from '../shared/provider-stage-diagnostic';
import { buildWikipediaAtomFromEvidence } from './typing';

export type WikipediaDomainApiAdapterOptions = {
	/**
	 * Transport seam for fixtures: a pin-aware fetch (`createPinAwareFetch`). Any other fetcher,
	 * including the default `globalThis.fetch`, is ignored and the shared pinned transport dials.
	 */
	fetch?: PinAwareFetch;
	language?: string;
	/** Defaults to the shared descriptive Wikimedia User-Agent. */
	userAgent?: string;
};

export type WikipediaDomainApiAdapter = PlatformStageAdapter;

const DEFAULT_LANGUAGE = 'en';
/** The summary is a few KiB; a body over this is not a summary. */
const MAX_SUMMARY_BYTES = 256 * 1024;

export function createWikipediaDomainApiAdapter(
	options: WikipediaDomainApiAdapterOptions = {}
): WikipediaDomainApiAdapter {
	const language = options.language ?? DEFAULT_LANGUAGE;
	const userAgent = options.userAgent ?? WIKIMEDIA_USER_AGENT;

	return async ({ domain, classification, canonicalUrl, signal, deadlineAtMs }) => {
		if (domain !== 'wikipedia' || classification.subtype !== 'article') {
			return PLATFORM_STAGE_MISS;
		}

		const title =
			toStringMaybe(classification.meta.articleTitle) ?? parseWikipediaTitleFromUrl(canonicalUrl);
		if (!title) {
			return PLATFORM_STAGE_MISS;
		}

		const endpoint = buildWikipediaSummaryEndpoint(canonicalUrl, title, language);
		// The shared provider fetch owns the pinned transport, the stage signal, the body cap and the
		// `wikipedia|classify_summary` request metric; a 404 is a miss. Its failures are structured
		// and become typed stage diagnostics.
		const payload = await fetchProviderJson({
			url: endpoint,
			fetch: options.fetch,
			headers: { Accept: 'application/json' },
			userAgent,
			signal,
			deadlineAtMs,
			maxResponseBytes: MAX_SUMMARY_BYTES,
			schema: z.record(z.string(), z.unknown()),
			observe: {
				provider: 'wikipedia',
				operation: 'classify_summary',
				statusOutcomes: WIKIMEDIA_STATUS_OUTCOMES,
			},
		}).catch((error: unknown) => {
			if (isWikimediaMiss(error)) return undefined;
			throw toProviderStageDiagnostic(error, 'Wikipedia', { signal, deadlineAtMs });
		});
		if (!payload) {
			return PLATFORM_STAGE_MISS;
		}

		const pageUrl =
			readNestedString(payload, ['content_urls', 'desktop', 'page']) ??
			readNestedString(payload, ['content_urls', 'mobile', 'page']) ??
			canonicalUrl;
		const titleFromPayload = toStringMaybe(payload.title) ?? title;
		const description = toStringMaybe(payload.description);
		const extract = toStringMaybe(payload.extract);
		const wikibaseItem = toStringMaybe(payload.wikibase_item);

		return buildWikipediaAtomFromEvidence({
			canonicalUrl,
			classificationConfidence: classification.confidence,
			description,
			extract,
			pageUrl,
			sourceFamily: 'domain-api',
			title: titleFromPayload,
			wikibaseItem,
		});
	};
}

export function buildWikipediaSummaryEndpoint(
	canonicalUrl: string,
	title: string,
	defaultLanguage = DEFAULT_LANGUAGE
): string {
	const host = resolveWikipediaHost(canonicalUrl, defaultLanguage);
	return `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
}

function resolveWikipediaHost(canonicalUrl: string, defaultLanguage: string): string {
	try {
		const parsed = new URL(canonicalUrl);
		const hostname = parsed.hostname.toLowerCase();
		if (hostname === 'wikipedia.org' || hostname.endsWith('.wikipedia.org')) {
			return hostname;
		}
	} catch {
		// Fall through to the configured language host.
	}

	return `${defaultLanguage}.wikipedia.org`;
}

function parseWikipediaTitleFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.toLowerCase().endsWith('wikipedia.org')) {
			return undefined;
		}
		const segments = parsed.pathname.split('/').filter(Boolean);
		if (segments[0] !== 'wiki' || segments.length < 2) {
			return undefined;
		}
		return decodeURIComponent(segments.slice(1).join('/')).replace(/_/g, ' ');
	} catch {
		return undefined;
	}
}

function readNestedString(record: Record<string, unknown>, path: string[]): string | undefined {
	let current: unknown = record;
	for (const segment of path) {
		const currentRecord = toRecordMaybe(current);
		if (!currentRecord) {
			return undefined;
		}
		current = currentRecord[segment];
	}

	return toStringMaybe(current);
}
