import { toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import { createPlatformPlugin, type PlatformV0Profile } from '../shared/platform';

const SHOPIFY_HOST_SUFFIX = '.myshopify.com';

export const shopifyProfile: PlatformV0Profile = {
	domain: 'shopify',
	display: {
		classificationSlugs: ['product'],
		exampleUrl: 'https://acme-store.myshopify.com/products/handmade-blue-mug',
		host: 'myshopify.com',
		label: 'Shopify',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'shopify-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseShopifyUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'shopify',
				subtype: 'product',
				confidence: 0.99,
				meta: target,
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const host = toStringMaybe(classification.meta.host);
		const slug = toStringMaybe(classification.meta.slug);
		if (!(host && slug)) {
			return null;
		}

		const name = humanizeSlug(slug);
		const canonicalId = `shopify:product:${host}:${slug}`;
		return withPlatformMetadata(
			{
				schemaType: 'Product',
				category: 'product',
				title: name,
				canonicalId,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Product',
					name,
					identifier: canonicalId,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'shopify',
			classification.subtype,
			{
				pluginId: 'shopify',
				provider: 'shopify',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createShopifyPlugin() {
	return createPlatformPlugin({
		pluginId: 'shopify',
		resolverId: 'shopify-resolver',
		profile: shopifyProfile,
	});
}

function parseShopifyUrl(
	input: string
): { host: string; slug: string; canonicalUrl: string } | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
		return undefined;
	}

	const host = parsed.hostname.toLowerCase();
	if (!host.endsWith(SHOPIFY_HOST_SUFFIX) || host === SHOPIFY_HOST_SUFFIX.slice(1)) {
		return undefined;
	}

	const match = parsed.pathname.match(/^\/products\/([^/]+)\/?$/i);
	const slug = normalizeSlug(match?.[1]);
	if (!slug) {
		return undefined;
	}

	return {
		host,
		slug,
		canonicalUrl: `https://${host}/products/${slug}`,
	};
}

function normalizeSlug(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	let decoded: string;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		return undefined;
	}

	const slug = decoded.toLowerCase();
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : undefined;
}

function humanizeSlug(slug: string): string {
	return slug
		.split('-')
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(' ');
}
