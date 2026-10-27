import { toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import { createPlatformPlugin, type PlatformV0Profile } from '../shared/platform';

const COINGECKO_HOST = 'coingecko.com';

export const coingeckoProfile: PlatformV0Profile = {
	domain: 'coingecko',
	display: {
		classificationSlugs: ['thing'],
		exampleUrl: 'https://coingecko.com/en/coins/bitcoin',
		host: COINGECKO_HOST,
		label: 'CoinGecko',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'coingecko-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseCoinGeckoUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'coingecko',
				subtype: 'coin',
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
		const canonicalId = `coingecko:${slug}`;
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
			'coingecko',
			classification.subtype,
			{
				pluginId: 'coingecko',
				provider: 'coingecko',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createCoinGeckoPlugin() {
	return createPlatformPlugin({
		pluginId: 'coingecko',
		resolverId: 'coingecko-resolver',
		profile: coingeckoProfile,
	});
}

function parseCoinGeckoUrl(input: string): { slug: string; canonicalUrl: string } | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
		return undefined;
	}

	const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
	if (host !== COINGECKO_HOST) {
		return undefined;
	}

	const match = parsed.pathname.match(/^\/(?:en\/)?coins\/([^/]+)\/?$/i);
	const slug = normalizeSlug(match?.[1]);
	if (!slug) {
		return undefined;
	}

	return {
		slug,
		canonicalUrl: `https://${COINGECKO_HOST}/en/coins/${slug}`,
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
