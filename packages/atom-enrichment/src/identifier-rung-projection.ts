import {
	derivePodcastGuid,
	normalizePodcastFeedUrl,
	parseIntuitionId,
	SCHEMES,
	type SchemeName,
} from '@0xintuition/iid';
import {
	createLadder,
	type IdentityCategory,
	identityRungsForCategory,
	isPlainWdPrimaryAllowed,
	SCHEMA_TYPE_IDENTITY_CATEGORIES,
} from '@0xintuition/iid-ladder';

import { IDENTIFIER_RUNG_MAX_ITEMS } from './data-resolved-schema';
import type { MaterializedIdentityRungToken } from './facet-registry';
import { resolveIdentifierHints } from './identifier';
import { isValidSpotifyId } from './plugins/providers/spotify';

// Preserve the application-local handle policy of the reference package.
const { iidForIdentityRung } = createLadder({ providerLocalHandles: 'mint' });

export type ProjectedIdentifierRung = {
	rung: MaterializedIdentityRungToken;
	value: string;
};

/**
 * Preserve admitted identities across fresh worker projections, newest entries
 * first. Overflow contract: the cap only ever drops entries that are NEW in the
 * fresh projection, so a worker pass can never delete a persisted alias row.
 * While the current document has room, every admitted current entry is kept
 * and the fresh-only entries fill the remaining budget, the one carrying the
 * stored primary first. A current document that already fills the cap keeps
 * itself: the entry carrying the stored primary leads, the rest follow in
 * stored order, and nothing new is admitted, so a fresh duplicate can neither
 * reorder nor displace a stored entry. The primary itself lives on the row and
 * never depends on its document rung.
 */
export function mergeAdmittedIdentifierRungs(
	schemaType: string,
	fresh: unknown,
	current: unknown,
	primaryIid?: string | null
): ProjectedIdentifierRung[] {
	const admitted = (entries: unknown): ProjectedIdentifierRung[] => {
		const result: ProjectedIdentifierRung[] = [];
		for (const entry of Array.isArray(entries) ? entries : []) {
			if (
				!entry ||
				typeof entry !== 'object' ||
				typeof entry.rung !== 'string' ||
				typeof entry.value !== 'string'
			)
				continue;
			const rung = entry.rung.trim();
			const value = entry.value.trim();
			if (!value || !isIdentifierRungAllowed(schemaType, rung)) continue;
			result.push({ rung: rung as MaterializedIdentityRungToken, value });
		}
		return result;
	};
	const key = (entry: ProjectedIdentifierRung) => JSON.stringify([entry.rung, entry.value]);
	const dedupe = (entries: readonly ProjectedIdentifierRung[]) => {
		const seen = new Set<string>();
		return entries.filter((entry) => {
			const entryKey = key(entry);
			if (seen.has(entryKey)) return false;
			seen.add(entryKey);
			return true;
		});
	};
	const carriesPrimary = (entry: ProjectedIdentifierRung) =>
		Boolean(primaryIid) && iidForIdentityRung(entry.rung, entry.value, schemaType) === primaryIid;
	const primaryFirst = (entries: readonly ProjectedIdentifierRung[]) => [
		...entries.filter(carriesPrimary),
		...entries.filter((entry) => !carriesPrimary(entry)),
	];
	const freshEntries = dedupe(admitted(fresh));
	const currentEntries = dedupe(admitted(current));
	const merged = dedupe([...freshEntries, ...currentEntries]);
	if (merged.length <= IDENTIFIER_RUNG_MAX_ITEMS) return merged;
	if (currentEntries.length >= IDENTIFIER_RUNG_MAX_ITEMS) {
		return primaryFirst(currentEntries).slice(0, IDENTIFIER_RUNG_MAX_ITEMS);
	}
	const currentKeys = new Set(currentEntries.map(key));
	const keptFresh = new Set(
		primaryFirst(freshEntries.filter((entry) => !currentKeys.has(key(entry))))
			.slice(0, IDENTIFIER_RUNG_MAX_ITEMS - currentEntries.length)
			.map(key)
	);
	return merged.filter((entry) => currentKeys.has(key(entry)) || keptFresh.has(key(entry)));
}

export type ProjectIdentifierRungsInput = {
	canonicalUrl?: string;
	data: Record<string, unknown>;
	evidence?: readonly unknown[];
	existingIdentifier?: unknown;
	schemaType?: string;
	sourceFamily?: string;
};

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const SINGLE_CATEGORY_SOURCE_FAMILIES = {
	spotify_artist: 'artist',
	spotify_album: 'music-album',
	musicbrainz_recording: 'song',
	openlibrary_book: 'book',
	spotify_episode: 'podcast-episode',
	spotify_podcast_episode: 'podcast-episode',
	spotify_podcast_show: 'podcast-series',
	spotify_show: 'podcast-series',
	spotify_track: 'song',
	tmdb_movie: 'movie',
	tmdb_tv: 'tv-series',
} as const satisfies Readonly<Record<string, IdentityCategory>>;

const SCHEME_EVIDENCE_KEYS: Readonly<Partial<Record<SchemeName, readonly string[]>>> = {
	gtin: ['gtin', 'upc', 'ean', 'identifier'],
	isni: ['isni', 'identifier', 'sameAs'],
	mbid: ['mbid', 'musicBrainzArtistId', 'musicBrainzReleaseGroupId', 'identifier', 'sameAs'],
	imdb: ['imdb', 'imdbId', 'imdb_id', 'identifier', 'sameAs', 'url'],
	isbn: ['isbn13', 'isbn_13', 'isbn', 'identifier'],
	isrc: ['isrc', 'isrcCode', 'isrc_code', 'identifier'],
	olid: [
		'editionOlid',
		'olid',
		'openlibraryId',
		'openlibrary_id',
		'provider_item_id',
		'identifier',
		'sameAs',
		'url',
	],
	podcastguid: ['podcastGuid', 'podcast_guid', 'feedGuid', 'feed_guid', 'identifier'],
	rssitem: ['rssitem', 'rssItem', 'rss_item', 'identifier'],
	wd: [
		'wd',
		'wikidata',
		'wikidata_id',
		'wikidataId',
		'wikibase_item',
		'wikibaseItem',
		'qid',
		'identifier',
		'sameAs',
		'url',
	],
};

/**
 * Derives descriptive identifier rungs from the same resolved document and
 * normalized artifact evidence used by every materialization adapter.
 */
export function projectIdentifierRungs(
	input: ProjectIdentifierRungsInput
): ProjectedIdentifierRung[] {
	const schemaType = readString(input.schemaType) ?? readString(input.data['@type']) ?? '';
	const category = identityCategoryForProjection(input.sourceFamily ?? '', schemaType);
	if (!category) return [];

	const evidence = collectCandidateEvidenceRecords([input.data, ...(input.evidence ?? [])]);
	const existingIdentifiers = [input.existingIdentifier, input.data.identifier];
	const result: ProjectedIdentifierRung[] = [];
	const seen = new Set<string>();
	const setRungs = new Set<MaterializedIdentityRungToken>();
	const append = (entry: ProjectedIdentifierRung) => {
		const key = JSON.stringify([entry.rung, entry.value]);
		if (seen.has(key)) return;
		seen.add(key);
		result.push(entry);
	};
	// Set members identify one work by construction. The set wins over disagreeing
	// loose evidence; loose evidence cannot add a competing value or suppress it.
	for (const member of evidence.flatMap((candidate) => stringsFromValue(candidate.identifierSet))) {
		for (const rung of identityRungsForCategory(category)) {
			if (!member.startsWith(`int:${rung.split(':')[0]}:`)) continue;
			if (
				rung === 'podcastguid' &&
				evidenceValues(evidence, ['podcastGuid', 'podcast_guid', 'feedGuid', 'feed_guid'])
					.flatMap(stringsFromValue)
					.some((value) => SCHEMES.podcastguid.canonicalize(value))
			)
				continue;
			const value = rungValue({
				evidence: [
					{ ...resolveIdentifierHints({ jsonLd: { identifier: member } }), identifier: member },
				],
				existingIdentifiers: [member],
				rung,
				schemaType,
				sourceFamily: input.sourceFamily ?? '',
			});
			if (!value) continue;
			setRungs.add(rung);
			append({ rung, value });
		}
	}

	for (const rung of identityRungsForCategory(category)) {
		if (setRungs.has(rung)) continue;
		const value = rungValue({
			canonicalUrl: input.canonicalUrl,
			evidence,
			existingIdentifiers,
			rung,
			schemaType,
			sourceFamily: input.sourceFamily ?? '',
		});
		if (value) append({ rung, value });
	}
	return result.slice(0, IDENTIFIER_RUNG_MAX_ITEMS);
}

function identityCategoryForProjection(
	sourceFamily: string,
	schemaType: string
): IdentityCategory | undefined {
	const singleCategory =
		SINGLE_CATEGORY_SOURCE_FAMILIES[sourceFamily as keyof typeof SINGLE_CATEGORY_SOURCE_FAMILIES];
	return singleCategory ?? SCHEMA_TYPE_IDENTITY_CATEGORIES[schemaType];
}

function rungValue(input: {
	canonicalUrl?: string;
	evidence: readonly Record<string, unknown>[];
	existingIdentifiers: readonly unknown[];
	rung: MaterializedIdentityRungToken;
	schemaType: string;
	sourceFamily: string;
}): string | undefined {
	if (input.rung.startsWith('tmdb:')) {
		return unambiguousTmdbValue(input);
	}
	if (input.rung.startsWith('spotify:')) {
		return unambiguousSpotifyValue(input);
	}
	if (input.rung === 'apple-podcasts') {
		return unambiguousPositiveIntegerValue(input, ['itunesId', 'applePodcastsId']);
	}
	if (input.rung === 'podcast-index') {
		return unambiguousPositiveIntegerValue(input, [
			'podcastIndexId',
			'podcast_index_id',
			'podcast_index',
		]);
	}
	if (input.rung === 'goodreads:book') {
		return unambiguousGoodreadsValue(input);
	}

	const schemeName = input.rung.split(':', 1)[0] ?? '';
	if (!isSchemeName(schemeName)) return undefined;
	if (input.rung === 'olid') {
		// A provider may report both the selected work and its fetched edition.
		// Keep the work key; never turn those two levels into competing works.
		const works = new Set(
			evidenceValues(input.evidence, ['workOlid'])
				.flatMap(stringsFromValue)
				.flatMap((value) => {
					const canonical = SCHEMES.olid.canonicalize(value);
					return canonical && /^OL\d+W$/u.test(canonical) ? [canonical] : [];
				})
		);
		if (works.size) return works.size === 1 ? [...works][0] : undefined;
	}
	if (input.rung === 'podcastguid') {
		const declarations = [
			...new Set(
				evidenceValues(input.evidence, ['podcastGuid', 'podcast_guid', 'feedGuid', 'feed_guid'])
					.flatMap(stringsFromValue)
					.flatMap((value) => {
						const canonical = SCHEMES.podcastguid.canonicalize(value);
						return canonical ? [canonical] : [];
					})
			),
		];
		if (declarations.length) return declarations.length === 1 ? declarations[0] : undefined;
	}

	for (const identifier of input.existingIdentifiers) {
		if (typeof identifier !== 'string') continue;
		const parsed = parseIntuitionId(identifier);
		if (parsed?.scheme !== schemeName) continue;
		const canonical = SCHEMES[schemeName].canonicalize(parsed.value);
		const value = canonical ? displayRungValue(input.rung, canonical, input.schemaType) : undefined;
		// A rung-invalid existing identifier (an IMDb person id on a title rung, a
		// malformed OLID) must not suppress valid remaining candidates.
		if (value) return value;
	}
	const typedMbidFields =
		schemeName === 'mbid'
			? [
					...evidenceValues(input.evidence, ['musicBrainzArtistId'])
						.flatMap(stringsFromValue)
						.map((value) => (value.includes(':') ? value : `artist:${value}`)),
					...evidenceValues(input.evidence, ['musicBrainzReleaseGroupId'])
						.flatMap(stringsFromValue)
						.map((value) => (value.includes(':') ? value : `release-group:${value}`)),
				]
			: [];
	const candidates = [
		...typedMbidFields,
		...evidenceValues(input.evidence, SCHEME_EVIDENCE_KEYS[schemeName] ?? []).flatMap(
			stringsFromValue
		),
		...input.existingIdentifiers.flatMap(stringsFromValue),
	];
	const canonicalValues = candidates.flatMap((candidate) => {
		const canonical = SCHEMES[schemeName].canonicalize(unwrapSchemeValue(schemeName, candidate));
		const value = canonical ? displayRungValue(input.rung, canonical, input.schemaType) : undefined;
		return value ? [value] : [];
	});
	const distinct = [...new Set(canonicalValues)];
	if (!distinct.length && input.rung === 'podcastguid') {
		const feeds = [
			...new Set(
				evidenceValues(input.evidence, ['feedUrl', 'rssFeedUrl'])
					.flatMap(stringsFromValue)
					.filter((url) => /^https?:\/\//u.test(url) && SCHEMES.url.canonicalize(url))
			),
		];
		return feeds.length === 1 ? derivePodcastGuid(normalizePodcastFeedUrl(feeds[0]!)) : undefined;
	}
	return distinct.length === 1 ? distinct[0] : undefined;
}

function unambiguousTmdbValue(input: {
	canonicalUrl?: string;
	evidence: readonly Record<string, unknown>[];
	existingIdentifiers: readonly unknown[];
	rung: MaterializedIdentityRungToken;
}): string | undefined {
	const subtype = input.rung.slice('tmdb:'.length);
	const canonicalValues = new Set<string>();
	for (const evidence of input.evidence) {
		const mediaTypes = valuesForKeys(evidence, ['mediaType', 'media_type', 'kind'])
			.flatMap(stringsFromValue)
			.map(normalizeTmdbMediaType);
		if (mediaTypes.some((mediaType) => mediaType && mediaType !== subtype)) continue;
		for (const value of valuesForKeys(evidence, ['tmdbId', 'tmdb_id'])) {
			const canonical = canonicalTmdbValue(value, subtype);
			if (canonical) canonicalValues.add(canonical);
		}
		for (const value of valuesForKeys(evidence, ['sameAs', 'url']).flatMap(stringsFromValue)) {
			// Only typed catalog URLs count here, not bare numbers in a URL field.
			if (!/^https?:\/\//iu.test(value)) continue;
			const canonical = canonicalTmdbValue(value, subtype);
			if (canonical) canonicalValues.add(canonical);
		}
	}
	for (const value of [...input.existingIdentifiers, input.canonicalUrl]) {
		const canonical = canonicalTmdbValue(value, subtype);
		if (canonical) canonicalValues.add(canonical);
	}
	return canonicalValues.size === 1 ? [...canonicalValues][0] : undefined;
}

function canonicalTmdbValue(value: unknown, subtype: string): string | undefined {
	const primitive = providerPrimitive(value);
	if (!primitive) return undefined;
	const prepared = POSITIVE_INTEGER_PATTERN.test(primitive) ? `${subtype}:${primitive}` : primitive;
	const canonical = SCHEMES.tmdb.canonicalize(unwrapSchemeValue('tmdb', prepared));
	const match = canonical?.match(/^(movie|tv):(\d+)$/u);
	return match?.[1] === subtype && match[2] && POSITIVE_INTEGER_PATTERN.test(match[2])
		? match[2]
		: undefined;
}

function unambiguousSpotifyValue(input: {
	evidence: readonly Record<string, unknown>[];
	existingIdentifiers: readonly unknown[];
	rung: MaterializedIdentityRungToken;
	sourceFamily: string;
}): string | undefined {
	const subtype = input.rung.slice('spotify:'.length);
	const candidates: unknown[] = [];
	for (const evidence of input.evidence) {
		const subtypeKey = `spotify${subtype[0]?.toUpperCase()}${subtype.slice(1)}Id`;
		candidates.push(
			...valuesForKeys(evidence, ['spotifyId', 'spotify_id', subtypeKey]).map((value) => {
				const primitive = providerPrimitive(value);
				return primitive?.startsWith(`${subtype}:`) ? primitive.slice(subtype.length + 1) : value;
			})
		);
		if (input.sourceFamily.endsWith(`_${subtype}`)) {
			candidates.push(...valuesForKeys(evidence, ['provider_item_id']));
		}
		for (const url of valuesForKeys(evidence, ['spotifyUrl', 'url', 'sameAs']).flatMap(
			stringsFromValue
		)) {
			const match = url.match(
				new RegExp(`^https://open\\.spotify\\.com/${subtype}/([^/?#]+)`, 'u')
			);
			if (match?.[1]) candidates.push(match[1]);
		}
	}
	for (const identifier of input.existingIdentifiers.flatMap(stringsFromValue)) {
		const prefix = `int:spotify:${subtype}:`;
		if (identifier.startsWith(prefix)) candidates.push(identifier.slice(prefix.length));
	}
	return unambiguousProviderValue(candidates, isValidSpotifyId);
}

function unambiguousPositiveIntegerValue(
	input: {
		evidence: readonly Record<string, unknown>[];
		existingIdentifiers: readonly unknown[];
		rung: MaterializedIdentityRungToken;
	},
	keys: readonly string[]
): string | undefined {
	const prefix = `int:${input.rung}:`;
	const candidates = [
		...input.evidence.flatMap((evidence) => valuesForKeys(evidence, keys)),
		...input.existingIdentifiers
			.flatMap(stringsFromValue)
			.filter((value) => value.startsWith(prefix))
			.map((value) => value.slice(prefix.length)),
	];
	return unambiguousProviderValue(candidates, isPositiveIntegerString);
}

function unambiguousGoodreadsValue(input: {
	evidence: readonly Record<string, unknown>[];
	existingIdentifiers: readonly unknown[];
	sourceFamily: string;
}): string | undefined {
	const candidates = input.evidence.flatMap((evidence) => [
		...valuesForKeys(evidence, ['goodreadsBookId', 'goodreads_book_id']),
		...stringsFromValue(evidence.identifier).flatMap((value) => {
			const match = value.match(/^int:goodreads:book:([1-9]\d*)$/u);
			return match?.[1] ? [match[1]] : [];
		}),
		...(input.sourceFamily.includes('goodreads')
			? valuesForKeys(evidence, ['provider_item_id'])
			: []),
	]);
	for (const identifier of input.existingIdentifiers.flatMap(stringsFromValue)) {
		const match = identifier.match(/^int:goodreads:book:(.+)$/u);
		if (match?.[1]) candidates.push(match[1]);
	}
	return unambiguousProviderValue(candidates, isPositiveIntegerString);
}

function unambiguousProviderValue(
	candidates: readonly unknown[],
	accept: (value: string) => boolean
): string | undefined {
	const canonicalValues = new Set(
		candidates.flatMap((candidate) => {
			const value = providerPrimitive(candidate);
			return value && accept(value) ? [value] : [];
		})
	);
	return canonicalValues.size === 1 ? [...canonicalValues][0] : undefined;
}

function isPositiveIntegerString(value: string): boolean {
	return POSITIVE_INTEGER_PATTERN.test(value);
}

function displayRungValue(
	rung: MaterializedIdentityRungToken,
	canonical: string,
	schemaType: string
): string | undefined {
	if (rung === 'mbid:release-group' && !canonical.startsWith('release-group:')) return undefined;
	if (rung === 'mbid:artist' && !canonical.startsWith('artist:')) return undefined;
	if (rung === 'imdb:title' && !/^tt\d+$/u.test(canonical)) return undefined;
	const [_scheme, subtype] = rung.split(':');
	if (!subtype) {
		if (rung === 'wd' && schemaType !== 'PodcastSeries' && !isPlainWdPrimaryAllowed(schemaType))
			return undefined;
		if (rung === 'olid' && schemaType === 'Book' && !/^OL\d+[MW]$/iu.test(canonical)) {
			return undefined;
		}
		return canonical;
	}
	if (rung.startsWith('wd:')) {
		const match = canonical.match(/^(?:([^:]+):)?(Q[1-9]\d*)$/u);
		return match && (!match[1] || match[1] === subtype) ? match[2] : undefined;
	}
	return canonical;
}

function normalizeTmdbMediaType(value: string): string {
	const normalized = value.trim().toLowerCase();
	return ['tv_series', 'tv_show'].includes(normalized) ? 'tv' : normalized;
}

function providerPrimitive(value: unknown): string | undefined {
	if (typeof value === 'string') return readString(value);
	return typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : undefined;
}

function collectCandidateEvidenceRecords(values: readonly unknown[]): Record<string, unknown>[] {
	const records: Record<string, unknown>[] = [];
	for (const value of values) {
		for (const entry of Array.isArray(value) ? value : [value]) {
			const candidate = record(entry);
			if (!candidate) continue;
			records.push(candidate);
			const identifiers = record(candidate.identifiers);
			if (identifiers) records.push(identifiers);
		}
	}
	return records;
}

function evidenceValues(
	records: readonly Record<string, unknown>[],
	keys: readonly string[]
): unknown[] {
	return records.flatMap((candidate) => valuesForKeys(candidate, keys));
}

function valuesForKeys(recordValue: Record<string, unknown>, keys: readonly string[]): unknown[] {
	return keys.flatMap((key) => (Object.hasOwn(recordValue, key) ? [recordValue[key]] : []));
}

function stringsFromValue(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(stringsFromValue);
	const normalized = readString(value);
	return normalized ? [normalized] : [];
}

function unwrapSchemeValue(scheme: SchemeName, value: string): string {
	const trimmed = value.trim();
	const iidPrefix = `int:${scheme}:`;
	if (trimmed.toLowerCase().startsWith(iidPrefix)) return trimmed.slice(iidPrefix.length);
	const legacyPrefix = `${scheme}:`;
	if (trimmed.toLowerCase().startsWith(legacyPrefix)) return trimmed.slice(legacyPrefix.length);
	if (scheme === 'wd' && trimmed.toLowerCase().startsWith('wikidata:')) {
		return trimmed.slice('wikidata:'.length);
	}
	return trimmed;
}

function isSchemeName(value: string): value is SchemeName {
	return Object.hasOwn(SCHEMES, value);
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

/** Uses the same category policy for supplied and derived aliases. */
export function isIdentifierRungAllowed(schemaType: string, rung: string): boolean {
	const category = identityCategoryForProjection('', schemaType);
	const allowed: readonly string[] = category ? identityRungsForCategory(category) : [];
	return allowed.includes(rung);
}
