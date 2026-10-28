import { tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import { buildPlacesCanonicalId, buildPlacesStableTitle } from './identity';
import { createPlacesOpenGraphAdapter } from './opengraph-adapter';

export type PlacesPluginOptions = PlatformV0PluginOptions & {
	// Maps place pages carry the business name in their OpenGraph title but
	// have no oEmbed/domain-api tier — default this on so a Maps link
	// resolves to a real business name whenever a fetcher is available,
	// while the identity-only fallback below stays network-free.
	useDefaultOpenGraphAdapter?: boolean;
};

function isGoogleMapsUrl(parsed: URL): boolean {
	const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
	if (host === 'maps.app.goo.gl' || host === 'maps.google.com') {
		return true;
	}

	return (
		(host === 'google.com' || host.endsWith('.google.com')) && parsed.pathname.startsWith('/maps')
	);
}

export const placesProfile: PlatformV0Profile = {
	domain: 'places',
	display: {
		classificationSlugs: ['local-business'],
		exampleUrl: 'https://maps.google.com/maps/place/Eiffel+Tower',
		host: 'maps.google.com',
		label: 'Google Places',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'places-url-classifier',
		priority: 10,
		classify(input: string) {
			const parsed = tryParseUrl(input, { allowBareHost: true });
			if (!parsed || !isGoogleMapsUrl(parsed)) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'places',
				subtype: 'place',
				confidence: 0.9,
				meta: {
					canonicalUrl: parsed.toString(),
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const name = buildPlacesStableTitle(canonicalUrl);

		return withPlatformMetadata(
			{
				schemaType: 'LocalBusiness',
				category: 'place',
				title: name,
				canonicalId: buildPlacesCanonicalId(canonicalUrl),
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'LocalBusiness',
					name,
					sameAs: [canonicalUrl],
				},
			},
			'places',
			'place',
			{
				pluginId: 'places',
				provider: 'places',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createPlacesPlugin(options: PlacesPluginOptions = {}) {
	const { useDefaultOpenGraphAdapter = true, ...platformOptions } = options;
	const openGraphAdapter =
		platformOptions.adapters?.openGraph ??
		(useDefaultOpenGraphAdapter ? createPlacesOpenGraphAdapter() : undefined);

	return createPlatformPlugin({
		pluginId: 'places',
		resolverId: 'places-resolver',
		profile: placesProfile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				openGraph: openGraphAdapter,
			},
		},
	});
}
