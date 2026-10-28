import { DATA_RESOLVED_MAX_BYTES, isAdmittedGenreValue } from './data-resolved-schema';
import { TMDB_GENRES } from './normalize/mappings/tmdb-genres';

export type CorpusProjectionArtifact = {
	artifactKind: string;
	data: unknown;
	error?: unknown;
	stableKey?: string | null;
	status?: string | null;
};

export type ProjectCorpusDataResolvedInput = {
	dataResolved: unknown;
	artifacts: readonly CorpusProjectionArtifact[];
	/** Raw control-plane field containing JSON for `{ record, authors }`. */
	openLibraryPayloadJson?: unknown;
	/** Optional flattened/raw Wikipedia evidence from a control-plane candidate. */
	wikipediaPayload?: unknown;
};

export type OpenLibraryProjectionPayload = {
	authors: readonly unknown[];
	record: Record<string, unknown>;
};

type ProjectedBookAuthor = {
	'@type': 'Person';
	identifier: string;
	name?: string;
	url: string;
};

const DESCRIPTION_MAX_LENGTH = 320;
const BOOK_SYNTHESIS_AUTHOR_LIMIT = 2;
const BOOK_SYNTHESIS_SUBJECT_LIMIT = 5;
const OPENLIBRARY_AUTHOR_ID = /^OL\d+A$/i;
const OPENLIBRARY_CATALOGUE_SUBJECTS = new Set([
	'accessible book',
	'books to borrow',
	'in library',
	'internet archive wishlist',
	'large type books',
	'lending library',
	'open library collection',
	'open library staff picks',
	'overdrive',
	'popular print disabled books',
	'protected daisy',
	'staff picks',
]);

/**
 * Applies provider-rich, identity-neutral fields to `data_resolved`.
 *
 * The function is deliberately storage-agnostic: callers normalize live or
 * persisted artifacts into `CorpusProjectionArtifact` at their thin adapter.
 * Identity-bearing atom `data` is never accepted and therefore cannot be
 * changed by this seam.
 */
export function projectCorpusDataResolvedFromArtifacts(
	input: ProjectCorpusDataResolvedInput
): unknown {
	if (!isRecord(input.dataResolved)) {
		return input.dataResolved;
	}

	const wikipediaCandidates = successfulArtifacts(input.artifacts, 'wikipedia')
		.map((artifact) => artifactDataRecord(artifact.data))
		.filter((value): value is Record<string, unknown> => value !== undefined);
	const wikipediaPayload = isRecord(input.wikipediaPayload) ? input.wikipediaPayload : undefined;
	if (wikipediaPayload) {
		wikipediaCandidates.push(wikipediaPayload);
	}

	const openLibraryCandidates = successfulArtifacts(input.artifacts, 'openlibrary')
		.map((artifact) => artifactDataRecord(artifact.data))
		.filter((value): value is Record<string, unknown> => value !== undefined);
	const rawOpenLibraryPayload = parseOpenLibraryProjectionPayload(input.openLibraryPayloadJson);

	const providerProjection = projectProviderFacets(input.dataResolved, input.artifacts);
	let projected = providerProjection.dataResolved;
	if (!readNonEmptyString(projected.description)) {
		const wikipediaDescription = firstWikipediaDescription(wikipediaCandidates);
		if (wikipediaDescription) {
			projected = { ...projected, description: wikipediaDescription };
		}
	}

	if (openLibraryCandidates.length === 0 && !rawOpenLibraryPayload) {
		return projectGenreDisplayNames(projected, providerProjection.genreQids);
	}

	const providerAuthors = dedupeBookAuthors([
		...openLibraryCandidates.flatMap(authorsFromOpenLibraryArtifact),
		...(rawOpenLibraryPayload ? authorsFromOpenLibraryPayload(rawOpenLibraryPayload) : []),
	]);
	const subjectEvidence = [
		...openLibraryCandidates.flatMap(subjectsFromOpenLibraryArtifact),
		...(rawOpenLibraryPayload ? stringsFromValue(rawOpenLibraryPayload.record.subjects) : []),
	];
	const providerSubjects = stableUniqueStrings(subjectEvidence);
	const visibleSubjects = visibleOpenLibrarySubjects(subjectEvidence);

	if (providerAuthors.length > 0 && !sameJsonValue(projected.author, providerAuthors)) {
		projected = { ...projected, author: providerAuthors };
	}
	if (providerSubjects.length > 0 && !sameJsonValue(projected.about, providerSubjects)) {
		projected = { ...projected, about: providerSubjects };
	}

	if (!readNonEmptyString(projected.description)) {
		const factualDescription = firstOpenLibraryDescription(openLibraryCandidates);
		const synthesisAuthors =
			providerAuthors.length > 0 ? providerAuthors : authorsFromProjectedValue(projected.author);
		const synthesizedDescription = factualDescription
			? undefined
			: synthesizeBookDescription(synthesisAuthors, visibleSubjects);
		const description = factualDescription ?? synthesizedDescription;
		if (description) {
			projected = { ...projected, description };
		}
	}

	projected = projectGenreDisplayNames(projected, providerProjection.genreQids);
	return sameJsonValue(projected, input.dataResolved) ? input.dataResolved : projected;
}

type ProviderFacetProjection = {
	actor?: string[];
	aggregateRating?: { bestRating: number; ratingCount?: number; ratingValue: number };
	countryOfOrigin?: string[];
	director?: string[];
	duration?: string;
	endDate?: string;
	genre?: string[];
	inLanguage?: string[];
	keywords?: string[];
	startDate?: string;
};

const PROVIDER_ARRAY_BOUNDS = {
	actor: { maxItems: 128, maxLength: 512 },
	countryOfOrigin: { maxItems: 16, maxLength: 64 },
	director: { maxItems: 32, maxLength: 512 },
	genre: { maxItems: 64, maxLength: 32 },
	inLanguage: { maxItems: 16, maxLength: 64 },
	keywords: { maxItems: 64, maxLength: 128 },
} as const;

/** Pinned labels are emitted only for QIDs recoverable from these artifacts. */
const TMDB_GENRE_NAME_BY_QID = new Map<string, string>(
	TMDB_GENRES.map((mapping) => [mapping.qid, mapping.tmdbName])
);
// Closed display vocabulary: a provider-supplied genre string is admitted only
// when it is a pinned TMDB genre name — unmapped strings are dropped, never
// guessed, matching the pre-interim behavior for unmapped numeric ids.
const TMDB_GENRE_NAMES = new Set<string>(TMDB_GENRES.map((mapping) => mapping.tmdbName));

function projectGenreDisplayNames(
	projected: Record<string, unknown>,
	genreQids: ReadonlySet<string>
): Record<string, unknown> {
	if (!Array.isArray(projected.genre)) return projected;
	const genre = uniqueStringsInOrder(
		stringsFromValue(projected.genre).map((value) =>
			genreQids.has(value) ? (TMDB_GENRE_NAME_BY_QID.get(value) ?? value) : value
		)
	);
	const translated = { ...projected, genre };
	// Labels must never spend another facet's byte budget. At the cap retain
	// QIDs (and the original artifacts), so repeated projection is stable and
	// the downstream provider budget trims exactly as it did before expansion.
	return new TextEncoder().encode(JSON.stringify(translated)).byteLength <= DATA_RESOLVED_MAX_BYTES
		? translated
		: projected;
}

function projectProviderFacets(
	dataResolved: Record<string, unknown>,
	artifacts: readonly CorpusProjectionArtifact[]
): { dataResolved: Record<string, unknown>; genreQids: ReadonlySet<string> } {
	const schemaType = readNonEmptyString(dataResolved['@type']) ?? 'Thing';
	const candidates: ProviderFacetProjection[] = [];

	for (const artifactKind of ['tmdb', 'podcast-index', 'openlibrary', 'spotify', 'apple-music']) {
		for (const artifact of successfulArtifacts(artifacts, artifactKind)) {
			const data = artifactDataRecord(artifact.data);
			if (!data) continue;
			const projection = providerFacetProjection(artifactKind, schemaType, data);
			if (projection) candidates.push(projection);
		}
	}

	const projected = { ...dataResolved };
	if (Object.hasOwn(projected, 'genre')) {
		const admitted = stringsFromValue(projected.genre).filter(isAdmittedGenreValue);
		if (admitted.length > 0) projected.genre = admitted;
		else delete projected.genre;
	}
	const genreQids = new Set(
		candidates
			.flatMap((candidate) => candidate.genre ?? [])
			.filter((value) => TMDB_GENRE_NAME_BY_QID.has(value))
	);
	for (const candidate of candidates) {
		for (const key of [
			'actor',
			'countryOfOrigin',
			'director',
			'genre',
			'inLanguage',
			'keywords',
		] as const) {
			const additions = candidate[key];
			if (!additions || additions.length === 0) continue;
			const merged = [...stringsFromValue(projected[key]), ...additions];
			projected[key] = boundedProviderStrings(
				key,
				key === 'genre' ? merged.filter(isAdmittedGenreValue) : merged
			);
		}
		for (const key of ['aggregateRating', 'duration', 'endDate', 'startDate'] as const) {
			if (projected[key] === undefined && candidate[key] !== undefined) {
				projected[key] = candidate[key];
			}
		}
	}
	return {
		dataResolved: sameJsonValue(projected, dataResolved) ? dataResolved : projected,
		genreQids,
	};
}

function boundedProviderStrings(
	key: keyof typeof PROVIDER_ARRAY_BOUNDS,
	values: readonly string[]
): string[] {
	const { maxItems, maxLength } = PROVIDER_ARRAY_BOUNDS[key];
	return uniqueStringsInOrder(values)
		.filter((value) => value.length <= maxLength)
		.slice(0, maxItems);
}

function providerFacetProjection(
	artifactKind: string,
	schemaType: string,
	data: Record<string, unknown>
): ProviderFacetProjection | undefined {
	switch (artifactKind) {
		case 'tmdb':
			return tmdbFacetProjection(schemaType, data);
		case 'podcast-index':
			return schemaType === 'PodcastSeries'
				? {
						inLanguage: stringsFromValue(data.language),
						// Podcast Index exposes the canonical iTunes taxonomy, but the
						// Wikidata crosswalk is not pinned yet. Preserve it without
						// letting unreviewed labels enter the QID-only genre facet.
						keywords: stringsFromValue(data.categories),
					}
				: undefined;
		case 'openlibrary':
			return schemaType === 'Book'
				? { keywords: subjectsFromOpenLibraryArtifact(data) }
				: undefined;
		case 'spotify':
		case 'apple-music':
			return isMusicSchemaType(schemaType)
				? {
						duration: isoDurationFromMilliseconds(data.durationMs),
						inLanguage: stringsFromValue(data.languages),
						keywords: stringsFromValue(data.genres),
					}
				: undefined;
		default:
			return undefined;
	}
}

function tmdbFacetProjection(
	schemaType: string,
	data: Record<string, unknown>
): ProviderFacetProjection | undefined {
	const category =
		schemaType === 'Movie' ? 'movie' : schemaType === 'TVSeries' ? 'tv-series' : null;
	if (!category) return undefined;
	const expectedMediaType = category === 'movie' ? 'movie' : 'tv';
	const mediaType = readNonEmptyString(data.mediaType);
	if (mediaType && mediaType !== expectedMediaType) return undefined;

	const payload = isRecord(data.tmdbApiPayload) ? data.tmdbApiPayload : data;
	// Keep numeric-ID evidence as QIDs until the final genre-only budget check.
	// Accept both artifact shapes: tmdbApiPayload.genres [{id, name}] and the
	// artifact-root data.genres ["Comedy", ...] string form. The top200k sweep
	// artifacts carry genres only at the artifact root, so fall back there when
	// the API payload has none.
	const genreSource = arrayFromValue(payload.genres).length > 0 ? payload.genres : data.genres;
	const genres = arrayFromValue(genreSource).flatMap((entry) => {
		if (typeof entry === 'string') {
			const label = readNonEmptyString(entry);
			const normalized = label ? normalizeWhitespace(label) : undefined;
			return normalized && TMDB_GENRE_NAMES.has(normalized) ? [normalized] : [];
		}
		if (!isRecord(entry)) return [];
		if (Object.hasOwn(entry, 'id')) {
			const mapping = TMDB_GENRES.find(
				(candidate) => candidate.category === category && candidate.tmdbId === entry.id
			);
			return mapping ? [mapping.qid] : [];
		}
		const providerName = readNonEmptyString(entry.name);
		const normalized = providerName ? normalizeWhitespace(providerName) : undefined;
		return normalized && TMDB_GENRE_NAMES.has(normalized) ? [normalized] : [];
	});
	const runtime = finiteNonnegativeNumber(data.runtime ?? payload.runtime);
	const voteAverage = finiteNonnegativeNumber(data.voteAverage ?? payload.vote_average);
	const voteCount = nonnegativeInteger(data.voteCount ?? payload.vote_count);
	const spokenLanguages = arrayFromValue(payload.spoken_languages).flatMap((entry) =>
		isRecord(entry) ? stringsFromValue(entry.iso_639_1) : []
	);
	const productionCountries = arrayFromValue(payload.production_countries).flatMap((entry) =>
		isRecord(entry) ? stringsFromValue(entry.iso_3166_1) : []
	);
	const credits = isRecord(payload.credits) ? payload.credits : undefined;
	const actors = arrayFromValue(credits?.cast).flatMap(creditName);
	const directors = arrayFromValue(credits?.crew).flatMap((entry) => {
		if (!isRecord(entry) || readNonEmptyString(entry.job)?.toLowerCase() !== 'director') return [];
		return creditName(entry);
	});

	return {
		actor: actors.length > 0 ? actors : arrayFromValue(data.topBilledCredits).flatMap(creditName),
		...(voteAverage === undefined
			? {}
			: {
					aggregateRating: {
						ratingValue: voteAverage,
						bestRating: 10,
						...(voteCount === undefined ? {} : { ratingCount: voteCount }),
					},
				}),
		countryOfOrigin:
			productionCountries.length > 0
				? productionCountries
				: stringsFromValue(data.productionCountries),
		director: directors,
		duration: runtime === undefined ? undefined : isoDurationFromMinutes(runtime),
		...(category === 'tv-series'
			? {
					endDate: isoDate(payload.last_air_date),
					startDate: isoDate(payload.first_air_date ?? data.releaseDate),
				}
			: {}),
		genre: genres,
		inLanguage:
			spokenLanguages.length > 0
				? spokenLanguages
				: stringsFromValue(data.originalLanguage ?? payload.original_language),
		keywords: stringsFromValue(data.keywords),
	};
}

function creditName(value: unknown): string[] {
	if (!isRecord(value)) return [];
	const name = readNonEmptyString(value.name);
	return name ? [normalizeWhitespace(name)] : [];
}

function isMusicSchemaType(schemaType: string): boolean {
	return ['MusicAlbum', 'MusicGroup', 'MusicRecording'].includes(schemaType);
}

function isoDate(value: unknown): string | undefined {
	const candidate = readNonEmptyString(value);
	if (!candidate || !/^\d{4}-\d{2}-\d{2}$/u.test(candidate)) return undefined;
	const date = new Date(`${candidate}T00:00:00.000Z`);
	return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== candidate
		? undefined
		: candidate;
}

function isoDurationFromMinutes(value: number): string | undefined {
	return value > 0 ? `PT${normalizeDurationNumber(value)}M` : undefined;
}

function isoDurationFromMilliseconds(value: unknown): string | undefined {
	const milliseconds = finiteNonnegativeNumber(value);
	return milliseconds && milliseconds > 0
		? `PT${normalizeDurationNumber(milliseconds / 1000)}S`
		: undefined;
}

function normalizeDurationNumber(value: number): string {
	return String(Number(value.toFixed(3)));
}

function finiteNonnegativeNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function nonnegativeInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** Provider-backed display name fallback used when a bare IID has no generic extractor result. */
export function resolveCorpusProjectionNameFromArtifacts(
	artifacts: readonly CorpusProjectionArtifact[]
): string | undefined {
	for (const artifactKind of ['openlibrary', 'wikipedia', 'spotify', 'tmdb', 'podcast-index']) {
		for (const artifact of successfulArtifacts(artifacts, artifactKind)) {
			const data = artifactDataRecord(artifact.data);
			if (!data) {
				continue;
			}
			const name = firstNonEmptyString(data, ['name', 'title']);
			if (name) {
				return normalizeWhitespace(name);
			}
		}
	}
	return undefined;
}

/** One predicate for intake/classifier fallbacks; provider titles must bypass it. */
export function isCorpusProjectionFallbackName(value: string, schemaType?: unknown): boolean {
	const normalized = normalizeWhitespace(value);
	const matches = (types: readonly string[], pattern: RegExp) =>
		(schemaType === undefined || schemaType === 'Thing' || types.includes(String(schemaType))) &&
		pattern.test(normalized);
	return (
		matches(
			['Book'],
			/^(?:OpenLibrary (?:Book(?: OL\d+M)?|Edition OL\d+M|Work OL\d+W)|Website (?:www\.)?openlibrary\.org)$/i
		) ||
		matches(['Book'], /^Goodreads Book\b/i) ||
		matches(['Movie', 'TVSeries'], /^(?:TMDB (?:Movie|TV Series)\b|tmdb_or_imdb_tmdb_bridge:)/i) ||
		matches(
			[
				'MusicRecording',
				'MusicAlbum',
				'Person',
				'PodcastSeries',
				'PodcastEpisode',
				'MusicPlaylist',
			],
			/^Spotify (?:Track|Album|Artist|Episode|Playlist|Show)\b/i
		) ||
		matches(['PodcastSeries'], /^Podcast Index (?:Show|Podcast)\b/i) ||
		matches(['Movie', 'TVSeries', 'Person'], /^IMDb (?:Title|Person)\b/i) ||
		matches(['VideoObject'], /^YouTube Video\b/i) ||
		matches(['SoftwareSourceCode'], /^GitHub Repo\b/i)
	);
}

/** Completed provider evidence is authoritative even when its title resembles an intake label. */
export function hasAuthoritativeProjectionName(
	value: string,
	artifacts: readonly CorpusProjectionArtifact[],
	schemaType: unknown
): boolean {
	const kinds =
		schemaType === 'Book'
			? ['openlibrary']
			: schemaType === 'Movie' || schemaType === 'TVSeries'
				? ['tmdb']
				: schemaType === 'MusicRecording'
					? ['spotify']
					: schemaType === 'PodcastSeries'
						? ['podcast-index', 'spotify']
						: [];
	return kinds.some((kind) =>
		successfulArtifacts(artifacts, kind).some((artifact) => {
			const data = artifactDataRecord(artifact.data);
			const title = data && firstNonEmptyString(data, ['name', 'title']);
			return title !== undefined && normalizeWhitespace(title) === normalizeWhitespace(value);
		})
	);
}

/** Parses the JSON-in-a-JSON-field shape stored at raw_row.openlibrary_payload_json. */
export function parseOpenLibraryProjectionPayload(
	value: unknown
): OpenLibraryProjectionPayload | undefined {
	let candidate = value;
	for (let depth = 0; depth < 2 && typeof candidate === 'string'; depth += 1) {
		const trimmed = candidate.trim();
		if (!trimmed) {
			return undefined;
		}
		try {
			candidate = JSON.parse(trimmed) as unknown;
		} catch {
			return undefined;
		}
	}

	if (!isRecord(candidate) || !isRecord(candidate.record) || !Array.isArray(candidate.authors)) {
		return undefined;
	}
	return { authors: candidate.authors, record: candidate.record };
}

function successfulArtifacts(
	artifacts: readonly CorpusProjectionArtifact[],
	artifactKind: string
): CorpusProjectionArtifact[] {
	return artifacts
		.filter(
			(artifact) =>
				artifact.artifactKind === artifactKind &&
				(artifact.status ?? 'active') === 'active' &&
				artifact.error == null
		)
		.map((artifact) => ({ ...artifact }))
		.sort((left, right) => compareText(artifactTieBreakKey(left), artifactTieBreakKey(right)));
}

function artifactTieBreakKey(artifact: CorpusProjectionArtifact): string {
	return [readNonEmptyString(artifact.stableKey) ?? '', stableJsonStringify(artifact.data)].join(
		'\u0000'
	);
}

function artifactDataRecord(value: unknown): Record<string, unknown> | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const nestedData = isRecord(value.data) ? value.data : undefined;
	return nestedData ?? value;
}

function firstWikipediaDescription(
	candidates: readonly Record<string, unknown>[]
): string | undefined {
	for (const candidate of candidates) {
		const extract = firstNonEmptyString(candidate, ['extract', 'wikipedia_extract']);
		if (extract) {
			return normalizeDescription(extract);
		}
		const description = firstNonEmptyString(candidate, ['description', 'wikipedia_description']);
		if (description) {
			return normalizeDescription(description);
		}
	}
	return undefined;
}

function firstOpenLibraryDescription(
	candidates: readonly Record<string, unknown>[]
): string | undefined {
	for (const candidate of candidates) {
		const description = readDescriptionValue(candidate.description);
		if (description) {
			return normalizeDescription(description);
		}
	}
	return undefined;
}

function authorsFromOpenLibraryArtifact(candidate: Record<string, unknown>): ProjectedBookAuthor[] {
	const schemaOrg = isRecord(candidate.schemaOrg) ? candidate.schemaOrg : undefined;
	const values = [...arrayFromValue(candidate.authors), ...arrayFromValue(schemaOrg?.author)];
	return values.flatMap((value) => {
		const author = isRecord(value) ? projectedBookAuthor(value) : undefined;
		return author ? [author] : [];
	});
}

function authorsFromOpenLibraryPayload(
	payload: OpenLibraryProjectionPayload
): ProjectedBookAuthor[] {
	const namesByOlid = new Map<string, string>();
	const joinedOlids: string[] = [];
	for (const value of payload.authors) {
		if (!isRecord(value)) {
			continue;
		}
		const olid = normalizeOpenLibraryAuthorId(value.key ?? value.olid ?? value.identifier);
		if (!olid) {
			continue;
		}
		joinedOlids.push(olid);
		const name = firstNonEmptyString(value, ['name', 'personal_name', 'personalName']);
		if (name && !namesByOlid.has(olid)) {
			namesByOlid.set(olid, normalizeWhitespace(name));
		}
	}

	const roleOlids = arrayFromValue(payload.record.authors).flatMap((value) => {
		if (!isRecord(value)) {
			return [];
		}
		const nestedAuthor = isRecord(value.author) ? value.author : value;
		const olid = normalizeOpenLibraryAuthorId(
			nestedAuthor.key ?? nestedAuthor.olid ?? nestedAuthor.identifier
		);
		return olid ? [olid] : [];
	});

	return uniqueStringsInOrder(roleOlids.length > 0 ? roleOlids : joinedOlids).map((olid) => ({
		'@type': 'Person',
		identifier: olid,
		...(namesByOlid.get(olid) ? { name: namesByOlid.get(olid) } : {}),
		url: `https://openlibrary.org/authors/${olid}`,
	}));
}

function authorsFromProjectedValue(value: unknown): { name?: string }[] {
	return arrayFromValue(value).flatMap((candidate): { name?: string }[] => {
		// The frozen Book classification declares author as a plain string;
		// synthesis needs only a name, so accept that shape alongside the
		// provider-rich Person[] entries (identifier-shaped strings excluded).
		if (typeof candidate === 'string') {
			const name = normalizeWhitespace(candidate);
			return name !== '' && !OPENLIBRARY_AUTHOR_ID.test(name) ? [{ name }] : [];
		}
		const author = isRecord(candidate) ? projectedBookAuthor(candidate) : undefined;
		return author ? [author] : [];
	});
}

function projectedBookAuthor(value: Record<string, unknown>): ProjectedBookAuthor | undefined {
	const olid = normalizeOpenLibraryAuthorId(
		value.olid ?? value.identifier ?? value.key ?? value.url
	);
	if (!olid) {
		return undefined;
	}
	const name = firstNonEmptyString(value, ['name', 'personal_name', 'personalName']);
	return {
		'@type': 'Person',
		identifier: olid,
		...(name ? { name: normalizeWhitespace(name) } : {}),
		url: `https://openlibrary.org/authors/${olid}`,
	};
}

function subjectsFromOpenLibraryArtifact(candidate: Record<string, unknown>): string[] {
	return [
		...stringsFromValue(candidate.subjects),
		...stringsFromValue(candidate.about),
		...(isRecord(candidate.schemaOrg) ? stringsFromValue(candidate.schemaOrg.about) : []),
	];
}

function visibleOpenLibrarySubjects(values: readonly string[]): string[] {
	return uniqueStringsInOrder(
		values
			// MARC-derived subjects commonly end with a period; trailing
			// punctuation would double up in the joined sentence and lets
			// catalogue tags slip past the exact-match denylist.
			.map((value) => normalizeWhitespace(value).replace(/[\s.,;:]+$/u, ''))
			.filter((value) => value !== '' && !OPENLIBRARY_CATALOGUE_SUBJECTS.has(value.toLowerCase()))
	);
}

function synthesizeBookDescription(
	authors: readonly { name?: string }[],
	subjects: readonly string[]
): string | undefined {
	const authorNames = authors
		.map((author) => readNonEmptyString(author.name))
		.filter((name): name is string => name !== undefined)
		.slice(0, BOOK_SYNTHESIS_AUTHOR_LIMIT);
	const topSubjects = subjects.slice(0, BOOK_SYNTHESIS_SUBJECT_LIMIT);
	const sentences: string[] = [];

	if (authorNames.length === 1) {
		sentences.push(`Book by ${authorNames[0]}.`);
	} else if (authorNames.length >= 2) {
		sentences.push(`Book by ${authorNames[0]} and ${authorNames[1]}.`);
	}
	if (topSubjects.length > 0) {
		sentences.push(`Subjects: ${topSubjects.join(', ')}.`);
	}

	return sentences.length > 0 ? normalizeDescription(sentences.join(' ')) : undefined;
}

function dedupeBookAuthors(authors: readonly ProjectedBookAuthor[]): ProjectedBookAuthor[] {
	const byOlid = new Map<string, ProjectedBookAuthor>();
	for (const author of authors) {
		const existing = byOlid.get(author.identifier);
		if (!existing || (!existing.name && author.name)) {
			byOlid.set(author.identifier, author);
		}
	}
	return [...byOlid.values()];
}

function normalizeOpenLibraryAuthorId(value: unknown): string | undefined {
	const text = readNonEmptyString(value);
	if (!text) {
		return undefined;
	}
	const normalized = text
		.replace(/^https?:\/\/(?:www\.)?openlibrary\.org\/authors\//i, '')
		.replace(/^\/authors\//i, '')
		.replace(/\/$/, '')
		.toUpperCase();
	return OPENLIBRARY_AUTHOR_ID.test(normalized) ? normalized : undefined;
}

function readDescriptionValue(value: unknown): string | undefined {
	const direct = readNonEmptyString(value);
	if (direct) {
		return direct;
	}
	return isRecord(value) ? readNonEmptyString(value.value) : undefined;
}

function normalizeDescription(value: string): string | undefined {
	const normalized = normalizeWhitespace(value);
	if (!normalized) {
		return undefined;
	}
	if (normalized.length <= DESCRIPTION_MAX_LENGTH) {
		return normalized;
	}
	const slice = normalized.slice(0, DESCRIPTION_MAX_LENGTH);
	const sentenceEnd = slice.lastIndexOf('. ');
	if (sentenceEnd > DESCRIPTION_MAX_LENGTH * 0.5) {
		return slice.slice(0, sentenceEnd + 1);
	}
	return `${slice.trimEnd()}…`;
}

function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function firstNonEmptyString(
	record: Record<string, unknown>,
	keys: readonly string[]
): string | undefined {
	for (const key of keys) {
		const value = readNonEmptyString(record[key]);
		if (value) {
			return value;
		}
	}
	return undefined;
}

function stringsFromValue(value: unknown): string[] {
	const values = Array.isArray(value) ? value : [value];
	return values.flatMap((entry) => {
		const direct = readNonEmptyString(entry);
		if (direct) {
			return [normalizeWhitespace(direct)];
		}
		if (isRecord(entry)) {
			const name = readNonEmptyString(entry.name);
			return name ? [normalizeWhitespace(name)] : [];
		}
		return [];
	});
}

function stableUniqueStrings(values: readonly string[]): string[] {
	const byFoldedValue = new Map<string, string>();
	for (const value of values) {
		const normalized = normalizeWhitespace(value);
		if (!normalized) {
			continue;
		}
		const folded = normalized.toLocaleLowerCase('en-US');
		const existing = byFoldedValue.get(folded);
		if (!existing || preferredStringVariant(existing, normalized) === normalized) {
			byFoldedValue.set(folded, normalized);
		}
	}
	return [...byFoldedValue.values()].sort(compareText);
}

function uniqueStringsInOrder(values: readonly string[]): string[] {
	const result: string[] = [];
	const indexByFoldedValue = new Map<string, number>();
	for (const value of values) {
		const normalized = normalizeWhitespace(value);
		if (!normalized) {
			continue;
		}
		const folded = normalized.toLocaleLowerCase('en-US');
		const existingIndex = indexByFoldedValue.get(folded);
		if (existingIndex === undefined) {
			indexByFoldedValue.set(folded, result.length);
			result.push(normalized);
			continue;
		}
		result[existingIndex] = preferredStringVariant(result[existingIndex] ?? normalized, normalized);
	}
	return result;
}

function preferredStringVariant(existing: string, candidate: string): string {
	const existingIsAllCaps = isAllCaps(existing);
	const candidateIsAllCaps = isAllCaps(candidate);
	if (existingIsAllCaps !== candidateIsAllCaps) {
		return existingIsAllCaps ? candidate : existing;
	}
	return compareText(candidate, existing) < 0 ? candidate : existing;
}

function isAllCaps(value: string): boolean {
	return value === value.toLocaleUpperCase('en-US') && value !== value.toLocaleLowerCase('en-US');
}

function arrayFromValue(value: unknown): unknown[] {
	if (value === undefined || value === null) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

function readNonEmptyString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
	return stableJsonStringify(left) === stableJsonStringify(right);
}

function compareText(left: string, right: string): number {
	if (left === right) {
		return 0;
	}
	return left < right ? -1 : 1;
}

function stableJsonStringify(value: unknown): string {
	return JSON.stringify(stableJsonValue(value)) ?? '';
}

function stableJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(stableJsonValue);
	}
	if (isRecord(value)) {
		return Object.fromEntries(
			Object.keys(value)
				.sort(compareText)
				.map((key) => [key, stableJsonValue(value[key])])
		);
	}
	return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
