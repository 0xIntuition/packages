import { AMBIGUOUS, TMDB_GENRES } from './mappings/tmdb-genres';

export type GenreCategory = 'movie' | 'tv-series' | 'book' | 'song' | 'podcast-series';

export interface GenreHierarchyRow {
	readonly ancestor_label_en: string | null;
	readonly ancestor_qid: string;
	readonly genre_qid: string;
}

export interface GenreLabelRow {
	readonly genre_qid: string;
	readonly label_en: string;
}

export interface GenreBandExclusion {
	readonly ancestor_qid: string;
	readonly reason: string;
}

export interface CrosswalkData {
	readonly bandExclusions: readonly GenreBandExclusion[];
	readonly categoryQids: Readonly<Partial<Record<GenreCategory, readonly string[]>>>;
	readonly hierarchyRows: readonly GenreHierarchyRow[];
	readonly labelRows: readonly GenreLabelRow[];
}

export type NormalizeGenreResult =
	| { readonly canonical: string; readonly qid: string; readonly status: 'mapped' }
	| { readonly canonical: string; readonly status: 'unknown' }
	| { readonly qid: string; readonly reason: string; readonly status: 'excluded' };

const CATEGORY_ALIASES: Readonly<Record<GenreCategory, Readonly<Record<string, string>>>> = {
	book: {
		'sci fi': 'science fiction',
	},
	movie: {
		'sci fi': 'science fiction',
	},
	'podcast-series': {
		'sci fi': 'science fiction',
	},
	song: {},
	'tv-series': {
		'sci fi': 'science fiction',
		'sci fi fantasy': 'science fiction fantasy',
	},
};

export function canonicalizeGenre(category: GenreCategory, rawValue: string): string {
	const folded = foldString(rawValue);
	return CATEGORY_ALIASES[category][folded] ?? folded;
}

export function normalizeGenre(
	input: { readonly category: GenreCategory; readonly source: string; readonly rawValue: string },
	data: CrosswalkData
): NormalizeGenreResult {
	const canonical = canonicalizeGenre(input.category, input.rawValue);
	const source = foldString(input.source);
	if (isAmbiguousSourceMapping(source, input.category, canonical)) {
		return { canonical, status: 'unknown' };
	}
	const mappedQid = findSourceMapping(source, input.category, canonical);
	const qid =
		mappedQid ?? findUniqueLabelQid(input.category, canonical, data.categoryQids, data.labelRows);

	if (!qid) {
		return { canonical, status: 'unknown' };
	}

	const exclusion = data.bandExclusions.find(({ ancestor_qid }) => ancestor_qid === qid);
	if (exclusion) {
		return { qid, reason: exclusion.reason, status: 'excluded' };
	}

	return { canonical, qid, status: 'mapped' };
}

export function expandGenre(qid: string, data: CrosswalkData): Set<string> {
	const excludedQids = new Set(data.bandExclusions.map(({ ancestor_qid }) => ancestor_qid));
	const ancestorsByGenre = new Map<string, Set<string>>();
	for (const row of data.hierarchyRows) {
		const ancestors = ancestorsByGenre.get(row.genre_qid) ?? new Set<string>();
		ancestors.add(row.ancestor_qid);
		ancestorsByGenre.set(row.genre_qid, ancestors);
	}

	const expanded = new Set<string>();
	const visited = new Set<string>();
	const pending = [qid];
	while (pending.length > 0) {
		const current = pending.pop();
		if (!current || visited.has(current)) continue;
		visited.add(current);
		if (!excludedQids.has(current)) expanded.add(current);

		for (const ancestor of ancestorsByGenre.get(current) ?? []) {
			if (!visited.has(ancestor)) pending.push(ancestor);
		}
	}

	return new Set([...expanded].sort());
}

function isAmbiguousSourceMapping(
	source: string,
	category: GenreCategory,
	canonical: string
): boolean {
	if (source !== 'tmdb' || category !== 'tv-series') return false;
	return AMBIGUOUS.some(
		(mapping) =>
			mapping.category === category && canonicalizeGenre(category, mapping.tmdbName) === canonical
	);
}

function findSourceMapping(
	source: string,
	category: GenreCategory,
	canonical: string
): string | undefined {
	if (source !== 'tmdb' || (category !== 'movie' && category !== 'tv-series')) return undefined;

	const matches = TMDB_GENRES.filter(
		(mapping) =>
			mapping.category === category && canonicalizeGenre(category, mapping.tmdbName) === canonical
	);
	return matches.length === 1 ? matches[0]?.qid : undefined;
}

function findUniqueLabelQid(
	category: GenreCategory,
	canonical: string,
	categoryQids: CrosswalkData['categoryQids'],
	labelRows: readonly GenreLabelRow[]
): string | undefined {
	const eligibleQids = new Set(categoryQids[category] ?? []);
	const matches = new Set(
		labelRows
			.filter(
				({ genre_qid, label_en }) =>
					eligibleQids.has(genre_qid) && canonicalizeGenre(category, label_en) === canonical
			)
			.map(({ genre_qid }) => genre_qid)
	);
	return matches.size === 1 ? matches.values().next().value : undefined;
}

function foldString(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/\p{M}+/gu, '')
		.toLocaleLowerCase('en-US')
		.replace(/[\p{P}\p{S}]+/gu, ' ')
		.replace(/\s+/gu, ' ')
		.trim();
}
