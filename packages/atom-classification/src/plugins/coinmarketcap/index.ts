import { toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import { createPlatformPlugin, type PlatformV0Profile } from '../shared/platform';

const COINMARKETCAP_HOST = 'coinmarketcap.com';

export const coinmarketcapProfile: PlatformV0Profile = {
	domain: 'coinmarketcap',
	display: {
		classificationSlugs: ['thing'],
		exampleUrl: 'https://coinmarketcap.com/currencies/bitcoin/',
		host: COINMARKETCAP_HOST,
		label: 'CoinMarketCap',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'coinmarketcap-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseCoinMarketCapUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'coinmarketcap',
				subtype: 'currency',
				confidence: 0.99,
				meta: target,
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const slug = toStringMaybe(classification.meta.slug);
		if (!slug) {
			return null;
		}

		const name = humanizeSlug(slug);
		const canonicalId = `coinmarketcap:${slug}`;
		return withPlatformMetadata(
			{
				schemaType: 'Cryptocurrency',
				category: 'thing',
				title: name,
				canonicalId,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Cryptocurrency',
					name,
					identifier: canonicalId,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'coinmarketcap',
			classification.subtype,
			{
				pluginId: 'coinmarketcap',
				provider: 'coinmarketcap',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createCoinMarketCapPlugin() {
	return createPlatformPlugin({
		pluginId: 'coinmarketcap',
		resolverId: 'coinmarketcap-resolver',
		profile: coinmarketcapProfile,
	});
}

function parseCoinMarketCapUrl(input: string): { slug: string; canonicalUrl: string } | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
		return undefined;
	}

	const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
	if (host !== COINMARKETCAP_HOST) {
		return undefined;
	}

	const match = parsed.pathname.match(/^\/currencies\/([^/]+)\/?$/i);
	const slug = normalizeSlug(match?.[1]);
	if (!slug) {
		return undefined;
	}

	return {
		slug,
		canonicalUrl: `https://${COINMARKETCAP_HOST}/currencies/${slug}/`,
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
