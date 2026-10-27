import { normalizeWhitespace } from '../shared/domain-html/document';
import {
	type DomainHtmlFetchLike,
	type DomainHtmlResolveHostname,
	resolveDomainHtmlFetch,
} from '../shared/domain-html/fetch';
import { buildIdentityResolverAtom } from '../shared/domain-html/identity';
import { toRecordMaybe, toStringMaybe } from '../shared/helpers';
import { PLATFORM_STAGE_MISS, type PlatformStageAdapter } from '../shared/platform';
import {
	extractAmazonAsinFromUrl,
	isAmazonShortLinkUrl,
	normalizeAmazonCanonicalUrl,
	resolveAmazonMarketplace,
	resolveAmazonShortLink,
} from './url';

type FetchLike = (
	input: Parameters<DomainHtmlFetchLike>[0],
	init?: Parameters<DomainHtmlFetchLike>[1]
) => Promise<Awaited<ReturnType<DomainHtmlFetchLike>> & { json(): Promise<unknown> }>;

type CanopyAmazonProductPayload = {
	data?: {
		amazonProduct?: Record<string, unknown>;
	};
};

const CANOPY_BASE_URL = 'https://rest.canopyapi.co/api/amazon/product';

export type AmazonDomainApiAdapterOptions = {
	apiKey?: string;
	fetch?: FetchLike;
	resolveHostname?: DomainHtmlResolveHostname;
};

export type AmazonDomainApiAdapter = PlatformStageAdapter;

export function createAmazonDomainApiAdapter(
	options: AmazonDomainApiAdapterOptions = {}
): AmazonDomainApiAdapter {
	const fetcher = options.fetch ?? resolveGlobalFetch();
	const shortLinkFetcher = resolveDomainHtmlFetch(options.fetch);

	return async ({ domain, classification, canonicalUrl, credential }) => {
		if (
			domain !== 'amazon' ||
			classification.subtype !== 'product' ||
			!fetcher ||
			!shortLinkFetcher
		) {
			return PLATFORM_STAGE_MISS;
		}

		const apiKey =
			toStringMaybe(options.apiKey) ??
			toStringMaybe(credential?.apiKey) ??
			toStringMaybe(credential?.token);
		if (!apiKey) {
			return PLATFORM_STAGE_MISS;
		}

		let productUrl = canonicalUrl;
		let asin = toStringMaybe(classification.meta.asin) ?? extractAmazonAsinFromUrl(canonicalUrl);
		if (!asin && isAmazonShortLinkUrl(canonicalUrl)) {
			const destination = await resolveAmazonShortLink(shortLinkFetcher, canonicalUrl, {
				resolveHostname: options.resolveHostname,
			});
			asin = destination ? extractAmazonAsinFromUrl(destination) : undefined;
			if (destination && asin) {
				productUrl = normalizeAmazonCanonicalUrl(destination, asin);
			}
		}
		if (!asin) {
			return PLATFORM_STAGE_MISS;
		}

		const response = await fetcher(buildCanopyProductUrl(productUrl, asin), {
			headers: {
				Accept: 'application/json',
				'API-KEY': apiKey,
			},
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} from Canopy Amazon API.`);
		}

		const payload = (await response.json()) as CanopyAmazonProductPayload;
		const product = toRecordMaybe(payload.data?.amazonProduct);
		if (!product) {
			return PLATFORM_STAGE_MISS;
		}

		const title = normalizeWhitespace(toStringMaybe(product.title));
		if (!title) {
			return PLATFORM_STAGE_MISS;
		}

		const brand = normalizeWhitespace(toStringMaybe(product.brand)) ?? undefined;
		const resolvedCanonicalUrl = normalizeWhitespace(toStringMaybe(product.url)) ?? productUrl;
		const image =
			normalizeWhitespace(toStringMaybe(product.mainImageUrl)) ??
			extractFirstImageUrl(product.imageUrls) ??
			undefined;
		const description = buildAmazonDescription(product, title);

		// Canopy gives us structured product identity without relying on blocked HTML.
		// Keep storefront state like price or stock out of deterministic publishable output.
		return buildIdentityResolverAtom({
			schemaType: 'Product',
			category: 'product',
			title,
			description,
			canonicalId: `asin:${asin}`,
			canonicalUrl: resolvedCanonicalUrl,
			pluginId: 'amazon',
			provider: 'amazon-canopy',
			fields: {
				sku: asin,
				...(brand ? { brand } : {}),
				...(image ? { image } : {}),
			},
		});
	};
}

function buildCanopyProductUrl(canonicalUrl: string, asin: string): string {
	const params = new URLSearchParams({
		asin,
		domain: resolveAmazonMarketplace(canonicalUrl),
	});
	return `${CANOPY_BASE_URL}?${params.toString()}`;
}

function extractFirstImageUrl(value: unknown): string | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}

	for (const entry of value) {
		const image = normalizeWhitespace(toStringMaybe(entry));
		if (image) {
			return image;
		}
	}

	return undefined;
}

function buildAmazonDescription(
	product: Record<string, unknown>,
	productTitle: string
): string | undefined {
	const subtitle = normalizeWhitespace(toStringMaybe(product.subtitle));
	if (subtitle && subtitle !== productTitle) {
		return subtitle;
	}

	const featureBullets = Array.isArray(product.featureBullets)
		? product.featureBullets
				.map((entry) => normalizeWhitespace(toStringMaybe(entry)))
				.filter((entry): entry is string => !!entry)
		: [];
	if (featureBullets.length === 0) {
		return undefined;
	}

	return featureBullets.slice(0, 3).join(' ');
}

function resolveGlobalFetch(): FetchLike | undefined {
	const globalFetch = (globalThis as { fetch?: FetchLike }).fetch;
	return typeof globalFetch === 'function' ? globalFetch : undefined;
}
