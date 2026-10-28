import { formatIntuitionId, parseIntuitionId, SCHEMES, type SchemeName } from '@0xintuition/iid';
import {
	projectIdentifierLadder,
	SCHEMA_TYPE_IDENTITY_CATEGORIES,
	schemeOrderForIdentityCategory,
} from '@0xintuition/iid-ladder';
import type { ClassificationResult } from './types';

type IdentifierAtom = {
	canonicalId?: string;
	data?: Record<string, unknown>;
	hints?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	sameAs?: readonly string[];
	schemaType?: string;
};

const SCHEME_KEYS: Record<string, SchemeName> = {
	imdbId: 'imdb',
	imdb_id: 'imdb',
	isbn13: 'isbn',
	isbn_13: 'isbn',
	isrcCode: 'isrc',
	isrc_code: 'isrc',
	workOlid: 'olid',
	editionOlid: 'olid',
	openlibraryId: 'olid',
	wikidata: 'wd',
	wikidataId: 'wd',
	qid: 'wd',
	podcastGuid: 'podcastguid',
	feedGuid: 'podcastguid',
	rssItem: 'rssitem',
};
const PROVIDER_KEYS: Record<string, string> = {
	goodreadsBookId: 'goodreads:book:',
	spotifyTrackId: 'spotify:track:',
	spotifyArtistId: 'spotify:artist:',
	spotifyAlbumId: 'spotify:album:',
	spotifyShowId: 'spotify:show:',
	spotifyEpisodeId: 'spotify:episode:',
	spotifyPlaylistId: 'spotify:playlist:',
	podcastIndexId: 'podcast-index:',
	itunesId: 'apple-podcasts:',
	applePodcastsId: 'apple-podcasts:',
};

/** Canonical identifiers, strongest first. Bridge hint records are never rewritten. */
export function collectAtomIdentifiers(atom: IdentifierAtom): string[] {
	const hints = record(atom.hints?.identifiers);
	const iids = new Set<string>();
	const wdSlug =
		typeof hints.wdSlug === 'string'
			? hints.wdSlug
			: atom.schemaType === 'Movie'
				? 'film'
				: atom.schemaType === 'TVSeries'
					? 'television-series'
					: undefined;
	const addScheme = (scheme: SchemeName, value: string) => {
		const canonical = SCHEMES[scheme].canonicalize(value);
		if (!canonical) return;
		const typed =
			scheme === 'wd' && wdSlug && !canonical.includes(':') ? `${wdSlug}:${canonical}` : canonical;
		iids.add(formatIntuitionId(scheme, typed));
	};
	const add = (value: string) => {
		const parsed = parseIntuitionId(value);
		if (parsed) {
			addScheme(parsed.scheme, parsed.value);
			return;
		}
		const provider = projectIdentifierLadder({
			providerCanonicalId: value.startsWith('int:') ? value.slice(4) : value,
		});
		if (provider.iid && 'rung' in provider && provider.rung !== 'url') {
			iids.add(provider.iid);
			return;
		}
		if (!/^https?:\/\//u.test(value)) return;
		for (const scheme of ['olid', 'imdb', 'tmdb', 'wd'] as const) addScheme(scheme, value);
		const spotify = value.match(
			/^https:\/\/open\.spotify\.com\/(track|artist|album|show|episode|playlist)\/([A-Za-z0-9]{22})(?:[/?#]|$)/u
		);
		if (spotify) add(`spotify:${spotify[1]}:${spotify[2]}`);
		const goodreads = value.match(
			/^https:\/\/(?:www\.)?goodreads\.com\/book\/show\/([1-9]\d*)(?:[./?#]|$)/u
		);
		if (goodreads) add(`goodreads:book:${goodreads[1]}`);
	};
	for (const source of [atom.data ?? {}, hints, record(atom.metadata?.identityBridge)]) {
		for (const [key, raw] of Object.entries(source)) {
			for (const value of strings(raw)) {
				if (
					key === 'identifier' ||
					key === 'sameAs' ||
					key === 'providerCanonicalId' ||
					key.startsWith('int:')
				)
					add(value);
				const scheme =
					SCHEME_KEYS[key] ?? (Object.hasOwn(SCHEMES, key) ? (key as SchemeName) : undefined);
				if (scheme) addScheme(scheme, value);
				if (PROVIDER_KEYS[key]) add(`${PROVIDER_KEYS[key]}${value}`);
				if (key === 'spotifyId' && value.includes(':')) add(`spotify:${value}`);
				if (key === 'tmdbId' || key === 'tmdb_id') {
					const mediaType = source.mediaType ?? source.media_type;
					addScheme('tmdb', value.includes(':') ? value : `${mediaType}:${value}`);
				}
			}
		}
	}
	for (const value of [
		atom.canonicalId,
		...(atom.sameAs ?? []),
		...strings(atom.hints?.providerCanonicalIds),
		...strings(atom.hints?.identifierSet),
	]) {
		if (value) add(value);
	}
	const category = SCHEMA_TYPE_IDENTITY_CATEGORIES[atom.schemaType ?? ''];
	const order = schemeOrderForIdentityCategory(category ?? '') ?? [];
	const rank = (iid: string) => {
		const index = order.indexOf(iid.split(':')[1] ?? '');
		return index < 0 ? order.length : index;
	};
	return [...iids].sort(
		(left, right) => rank(left) - rank(right) || left.localeCompare(right, 'en')
	);
}

export function normalizeClassificationIdentifiers(
	result: ClassificationResult
): ClassificationResult {
	if (!result.resolved) return result;
	return {
		...result,
		resolved: {
			...result.resolved,
			atoms: result.resolved.atoms.map((atom) => ({
				...atom,
				hints: { ...atom.hints, identifierSet: collectAtomIdentifiers(atom) },
			})),
		},
	};
}

function strings(value: unknown): string[] {
	return Array.isArray(value) ? value.flatMap(strings) : typeof value === 'string' ? [value] : [];
}
function record(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}
