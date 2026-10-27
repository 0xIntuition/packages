import { toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import { createPlatformPlugin, type PlatformV0Profile } from '../shared/platform';

export const etsyProfile: PlatformV0Profile = {
	domain: 'etsy',
	display: {
		classificationSlugs: ['product'],
		exampleUrl: 'https://www.etsy.com/listing/1234567890/handmade-blue-mug',
		host: 'etsy.com',
		label: 'Etsy',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'etsy-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseEtsyUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'etsy',
				subtype: 'listing',
				confidence: 0.99,
				meta: target,
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const listingId = toStringMaybe(classification.meta.listingId);
		if (!listingId) {
			return null;
		}

		const name = `Etsy Listing ${listingId}`;
		const canonicalId = `etsy:listing:${listingId}`;
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
					sku: listingId,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'etsy',
			classification.subtype,
			{
				pluginId: 'etsy',
				provider: 'etsy',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createEtsyPlugin() {
	return createPlatformPlugin({
		pluginId: 'etsy',
		resolverId: 'etsy-resolver',
		profile: etsyProfile,
	});
}

function parseEtsyUrl(input: string): { listingId: string; canonicalUrl: string } | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
		return undefined;
	}

	const host = parsed.hostname.toLowerCase();
	if (host !== 'etsy.com' && host !== 'www.etsy.com') {
		return undefined;
	}

	const match = parsed.pathname.match(/^\/listing\/([1-9]\d*)(?:\/.*)?$/i);
	const listingId = match?.[1];
	if (!listingId) {
		return undefined;
	}

	return {
		listingId,
		canonicalUrl: `https://www.etsy.com/listing/${listingId}`,
	};
}
