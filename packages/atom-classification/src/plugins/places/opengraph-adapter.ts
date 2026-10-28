import type { ResolverAtom } from '../../plugins';
import { toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	createOpenGraphPlatformAdapter,
	type OpenGraphMetadata,
	type OpenGraphPlatformAdapter,
} from '../shared/opengraph';
import { buildPlacesCanonicalId, buildPlacesStableTitle } from './identity';

export type PlacesOpenGraphAdapterOptions = {
	fetch?: Parameters<typeof createOpenGraphPlatformAdapter>[0]['fetch'];
	headers?: Record<string, string>;
	resolveHostname?: Parameters<typeof createOpenGraphPlatformAdapter>[0]['resolveHostname'];
};

export type PlacesOpenGraphAdapter = OpenGraphPlatformAdapter;

// Google Maps place pages set og:title to a useful provider label. Keep it as
// descriptive enrichment: identity-adjacent title/name always come from the
// URL so fetch success cannot change the atom users are about to create.
export function createPlacesOpenGraphAdapter(
	options: PlacesOpenGraphAdapterOptions = {}
): PlacesOpenGraphAdapter {
	return createOpenGraphPlatformAdapter({
		fetch: options.fetch,
		headers: options.headers,
		resolveHostname: options.resolveHostname,
		domains: ['places'],
		map: ({ canonicalUrl, metadata }) => buildPlaceOpenGraphAtom({ canonicalUrl, metadata }),
	});
}

function buildPlaceOpenGraphAtom(input: {
	canonicalUrl: string;
	metadata: OpenGraphMetadata;
}): ResolverAtom | null {
	const providerName = toStringMaybe(input.metadata.title);
	const description = toStringMaybe(input.metadata.description);
	if (!(providerName || description)) {
		return null;
	}

	const name = buildPlacesStableTitle(input.canonicalUrl);

	return withPlatformMetadata(
		{
			schemaType: 'LocalBusiness',
			category: 'place',
			title: name,
			description,
			canonicalId: buildPlacesCanonicalId(input.canonicalUrl),
			sameAs: [input.canonicalUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'LocalBusiness',
				name,
				sameAs: [input.canonicalUrl],
				...(providerName && providerName !== name ? { alternateName: providerName } : {}),
				...(description ? { description } : {}),
			},
		},
		'places',
		'place',
		{
			pluginId: 'places',
			provider: 'places-opengraph',
			sourceUrl: input.canonicalUrl,
			resolutionMode: 'identity-only',
		}
	);
}
