import {
	buildLetterboxdSameAs,
	type ParsedLetterboxdPage,
	parseLetterboxdUrl,
} from '@0xintuition/pipeline-runtime/letterboxd-page';
import type { AcquisitionOutcome } from '../../acquisition-outcome';
import { buildIdentityResolverAtom } from '../shared/domain-html/identity';

export function buildLetterboxdResolverAtom(page: ParsedLetterboxdPage) {
	if (!page.title || page.identity.status === 'identity_conflict') {
		return undefined;
	}
	const slug = parseLetterboxdUrl(page.canonicalUrl)?.slug;
	const tmdb = page.identity.status === 'resolved' ? page.identity : undefined;
	if (!tmdb && !slug) {
		return undefined;
	}
	const sameAs = buildLetterboxdSameAs({
		canonicalUrl: page.canonicalUrl,
		imdbUrl: page.imdbUrl,
		tmdbId: tmdb?.tmdbId,
		tmdbKind: tmdb?.kind,
	});
	const atom = buildIdentityResolverAtom({
		schemaType: page.schemaType,
		category: 'thing',
		title: page.title,
		description: page.description,
		canonicalId: tmdb ? `tmdb:${tmdb.kind}:${tmdb.tmdbId}` : `letterboxd:film:${slug as string}`,
		canonicalUrl: page.canonicalUrl,
		sameAs,
		pluginId: 'letterboxd',
		provider: page.titleSource === 'opengraph' ? 'letterboxd-opengraph' : 'letterboxd-html',
		fields: {
			...(page.image ? { image: page.image } : {}),
			...(page.dateCreated ? { dateCreated: page.dateCreated } : {}),
			...(page.releasedEvent ? { releasedEvent: page.releasedEvent } : {}),
			...(page.directors.length > 0
				? {
						director: page.directors.map((name) => ({ '@type': 'Person', name })),
					}
				: {}),
			...(page.genres.length > 0 ? { genre: page.genres } : {}),
			...(page.aggregateRating
				? { aggregateRating: { ...page.aggregateRating, bestRating: 5 } }
				: {}),
			...(page.year ? { year: page.year } : {}),
		},
	});
	if (page.titleSource !== 'opengraph') {
		return atom;
	}

	const acquisitionOutcome = {
		status: 'degraded',
		terminal: false,
		stage: 'domain-html',
		reason: 'opengraph_only',
	} satisfies AcquisitionOutcome;
	return {
		...atom,
		metadata: {
			...atom.metadata,
			acquisitionOutcome,
		},
	};
}
