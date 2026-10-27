import {
	buildLetterboxdSameAs as buildSharedLetterboxdSameAs,
	isLetterboxdHostname,
	type LetterboxdMediaKind,
	parseLetterboxdUrl,
} from '@0xintuition/pipeline-runtime/letterboxd-page';

export { parseLetterboxdUrl };

export function isLetterboxdHost(hostname: string): boolean {
	return isLetterboxdHostname(hostname);
}

export function buildLetterboxdSameAs(input: {
	canonicalUrl: string;
	imdbUrl?: string;
	tmdbId?: string;
	tmdbKind?: LetterboxdMediaKind;
}): string[] {
	return buildSharedLetterboxdSameAs(input);
}
