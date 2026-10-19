import {
	isActiveWdEntitySchemaSlug,
	MUSIC_IDENTITY_RUNG_POLICY,
	WD_ENTITYSCHEMA_BINDINGS,
	type WdEntitySchemaSlug,
} from '@0xintuition/iid';
import { PINNED_ACTIVE_WD_P31_CLOSURE } from './wd-p31-closure.js';

/**
 * Shared create/seed identity policy. Rows are strongest-first and provider
 * handles deliberately remain visible: they are stable aliases even when a
 * stronger authority identifier owns the primary IID.
 */
export const IDENTITY_CATEGORY_RUNG_POLICY = {
	artist: MUSIC_IDENTITY_RUNG_POLICY.artist.rungs,
	song: ['isrc', 'spotify:track'],
	'music-album': MUSIC_IDENTITY_RUNG_POLICY['music-album'].rungs,
	book: ['olid', 'isbn', 'goodreads:book'],
	movie: ['wd:film', 'tmdb:movie', 'imdb:title'],
	'tv-series': ['wd:television-series', 'tmdb:tv', 'imdb:title'],
	'podcast-series': ['podcastguid', 'podcast-index', 'spotify:show'],
	'podcast-episode': ['rssitem', 'podcast-index', 'spotify:episode'],
} as const;

/** Release and provider identities admitted for matching, never primary selection. */
export const IDENTITY_CATEGORY_ALIAS_ONLY_POLICY = {
	'music-album': ['gtin'],
	'podcast-series': ['wd', 'apple-podcasts'],
} as const;

export function identityRungsForCategory(category: IdentityCategory): readonly IdentityRungToken[] {
	return [
		...IDENTITY_CATEGORY_RUNG_POLICY[category],
		...(IDENTITY_CATEGORY_ALIAS_ONLY_POLICY[
			category as keyof typeof IDENTITY_CATEGORY_ALIAS_ONLY_POLICY
		] ?? []),
	];
}

export type IdentityCategory = keyof typeof IDENTITY_CATEGORY_RUNG_POLICY;
export type IdentityRungToken =
	| (typeof IDENTITY_CATEGORY_RUNG_POLICY)[IdentityCategory][number]
	| (typeof IDENTITY_CATEGORY_ALIAS_ONLY_POLICY)[keyof typeof IDENTITY_CATEGORY_ALIAS_ONLY_POLICY][number];

/** Runtime vocabulary and schema categories shared by classification and enrichment. */
export const IDENTITY_CATEGORIES = Object.keys(IDENTITY_CATEGORY_RUNG_POLICY) as [
	IdentityCategory,
	...IdentityCategory[],
];
export const IDENTITY_RUNG_TOKENS = [
	...new Set([
		...Object.values(IDENTITY_CATEGORY_RUNG_POLICY).flat(),
		...Object.values(IDENTITY_CATEGORY_ALIAS_ONLY_POLICY).flat(),
	]),
].sort() as [IdentityRungToken, ...IdentityRungToken[]];
export const SCHEMA_TYPE_IDENTITY_CATEGORIES: Readonly<Partial<Record<string, IdentityCategory>>> =
	{
		Book: 'book',
		Movie: 'movie',
		MusicAlbum: 'music-album',
		MusicGroup: 'artist',
		MusicRecording: 'song',
		PodcastEpisode: 'podcast-episode',
		PodcastSeries: 'podcast-series',
		TVSeries: 'tv-series',
	};

export { isPlainWdPrimaryAllowed } from '@0xintuition/iid';

export type WikidataP31Identity = {
	schemaType:
		| 'Book'
		| 'Movie'
		| 'MusicAlbum'
		| 'MusicRecording'
		| 'Organization'
		| 'Person'
		| 'PodcastEpisode'
		| 'PodcastSeries'
		| 'TVEpisode'
		| 'TVSeason'
		| 'TVSeries'
		| 'Thing'
		| 'VideoGame';
	wdSlug?: WdEntitySchemaSlug;
};

type WikidataP31PolicyRow = WikidataP31Identity & {
	p31: readonly string[];
};

const BINDING_WD_P31_IDENTITY_POLICY: readonly WikidataP31PolicyRow[] =
	WD_ENTITYSCHEMA_BINDINGS.map((binding) => ({
		p31:
			binding.status === 'active'
				? (PINNED_ACTIVE_WD_P31_CLOSURE[binding.slug] ?? binding.anchorQids)
				: binding.anchorQids,
		schemaType: binding.classification,
		...(binding.status === 'active' ? { wdSlug: binding.slug } : {}),
	}));

/**
 * Exact P31 mappings used by URL classification and typed-WD projection. Typed
 * rows are derived from the canonical EntitySchema binding registry; the
 * remaining rows classify known media without minting a dormant typed slug.
 */
export const WIKIDATA_P31_IDENTITY_POLICY: readonly WikidataP31PolicyRow[] = [
	...BINDING_WD_P31_IDENTITY_POLICY,
	{ p31: ['Q571', 'Q7725634'], schemaType: 'Book' },
	{ p31: ['Q2188189', 'Q3302947'], schemaType: 'MusicRecording' },
];

export function resolveWikidataP31Identity(p31: readonly string[]): WikidataP31Identity {
	const classes = new Set(p31);
	for (const row of WIKIDATA_P31_IDENTITY_POLICY) {
		if (!row.p31.some((qid) => classes.has(qid))) {
			continue;
		}
		const wdSlug = row.wdSlug;
		return wdSlug && isActiveWdEntitySchemaSlug(wdSlug)
			? { schemaType: row.schemaType, wdSlug }
			: { schemaType: row.schemaType };
	}
	return { schemaType: 'Thing' };
}

export function schemeOrderForIdentityCategory(category: string): readonly string[] | undefined {
	const normalizedCategory =
		category === 'music-recording' ? 'song' : category === 'podcast' ? 'podcast-series' : category;
	// Own-property guard: the policy is a plain object, so inherited names such
	// as `constructor` or `toString` must read as unknown categories, not throw.
	// (The intuition-v2 source lacks this guard; deliberate hardening.)
	if (!Object.hasOwn(IDENTITY_CATEGORY_RUNG_POLICY, normalizedCategory)) {
		return undefined;
	}
	const rungs = IDENTITY_CATEGORY_RUNG_POLICY[normalizedCategory as IdentityCategory];
	return rungs.map((rung) => rung.split(':', 1)[0] ?? rung);
}
