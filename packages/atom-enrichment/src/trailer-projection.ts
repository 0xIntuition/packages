import { z } from 'zod/v4';
import type { DataResolved } from './data-resolved-schema';
import type { NodeMaterializationArtifact } from './materialize-node-data-resolved';

type VideoObject = NonNullable<DataResolved['trailer']>;
type TrailerCandidate = {
	key: string;
	official: boolean;
	type: 'Trailer' | 'Teaser';
	publishedAt?: string;
	trailer: VideoObject;
};
const YOUTUBE_KEY = /^[A-Za-z0-9_-]{11}$/u;
const PUBLICATION_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u;
const isoDateTime = z.iso.datetime();
const NAME_MAX_LENGTH = 512;

/** Select one scalar from the current normalized TMDB artifacts, without I/O. */
export function selectPrimaryTrailer(
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[],
	schemaType: string
): VideoObject | undefined {
	if (schemaType !== 'Movie' && schemaType !== 'TVSeries') return undefined;
	const byKey = new Map<string, TrailerCandidate>();
	for (const artifact of artifacts) {
		const outer = record(artifact.data) ?? {};
		const data = record(outer.data) ?? outer;
		let results: unknown;
		switch (artifact.artifactKind) {
			case 'tmdb':
				results = record(record(data.tmdbApiPayload)?.videos)?.results;
				break;
			case 'tmdb_sidecar':
				results = record(data.videos)?.results;
				break;
			case 'tmdb-videos':
				results = data.results;
				break;
			default:
				continue;
		}
		if (!Array.isArray(results)) continue;
		for (const entry of results) {
			const candidate = trailerCandidate(entry);
			if (!candidate) continue;
			const previous = byKey.get(candidate.key);
			if (!previous || compareCandidates(candidate, previous) < 0)
				byKey.set(candidate.key, candidate);
		}
	}
	return [...byKey.values()].sort(compareCandidates)[0]?.trailer;
}

function trailerCandidate(value: unknown): TrailerCandidate | undefined {
	const video = record(value);
	if (
		!video ||
		video.site !== 'YouTube' ||
		(video.type !== 'Trailer' && video.type !== 'Teaser') ||
		typeof video.key !== 'string' ||
		!YOUTUBE_KEY.test(video.key)
	)
		return undefined;
	const key = video.key;
	const name =
		typeof video.name === 'string' ? video.name.trim().slice(0, NAME_MAX_LENGTH) : undefined;
	const language =
		typeof video.iso_639_1 === 'string' && /^[a-z]{2}$/u.test(video.iso_639_1)
			? video.iso_639_1
			: undefined;
	const country =
		typeof video.iso_3166_1 === 'string' && /^[A-Z]{2}$/u.test(video.iso_3166_1)
			? video.iso_3166_1
			: undefined;
	const publishedAt =
		typeof video.published_at === 'string' &&
		PUBLICATION_DATE.test(video.published_at) &&
		isoDateTime.safeParse(video.published_at).success
			? video.published_at
			: undefined;
	return {
		key,
		type: video.type,
		official: video.official === true,
		...(publishedAt ? { publishedAt } : {}),
		trailer: {
			'@type': 'VideoObject',
			...(name ? { name } : {}),
			url: `https://www.youtube.com/watch?v=${key}`,
			embedUrl: `https://www.youtube.com/embed/${key}`,
			thumbnailUrl: `https://i.ytimg.com/vi/${key}/hqdefault.jpg`,
			...(language ? { inLanguage: country ? `${language}-${country}` : language } : {}),
			...(publishedAt ? { uploadDate: publishedAt } : {}),
		},
	};
}

function compareCandidates(left: TrailerCandidate, right: TrailerCandidate): number {
	return (
		Number(left.type === 'Teaser') - Number(right.type === 'Teaser') ||
		Number(right.official) - Number(left.official) ||
		comparePublicationDates(left.publishedAt, right.publishedAt) ||
		compareText(left.key, right.key) ||
		// Identical keys can carry conflicting metadata across artifacts. Resolve that
		// remaining tie deterministically rather than using artifact arrival order.
		compareText(JSON.stringify(left.trailer), JSON.stringify(right.trailer))
	);
}

function comparePublicationDates(left: string | undefined, right: string | undefined): number {
	if (!left) return right ? 1 : 0;
	if (!right) return -1;
	// Both dates are UTC. Normalize fractional zeroes without losing sub-ms precision.
	const normalized = (date: string) =>
		`${date.slice(0, 19)}.${date.slice(19, -1).replace(/^\./u, '').replace(/0+$/u, '')}`;
	return compareText(normalized(left), normalized(right));
}

function compareText(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function record(value: unknown): Record<string, unknown> | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}
