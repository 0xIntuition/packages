import { z } from 'zod/v4';
import { IDENTITY_RUNG_TOKENS, MATERIALIZED_FIELDS } from './facet-registry';
import { isPublicHttpsUrl } from './image-policy';
import { TMDB_GENRES } from './normalize/mappings/tmdb-genres';

export const DATA_RESOLVED_MAX_BYTES = 64 * 1024;
const NAME_MAX_LENGTH = 512;
const URL_MAX_LENGTH = 8192;
const IDENTIFIER_MAX_LENGTH = 257;
const SHORT_STRING_MAX_LENGTH = 256;
const SAME_AS_MAX_ITEMS = 32;
const ABOUT_MAX_ITEMS = 64;
const AUTHOR_MAX_ITEMS = 12;
export const IDENTIFIER_RUNG_MAX_ITEMS = 32;
const GENRE_MAX_ITEMS = 64;
const KEYWORDS_MAX_ITEMS = 64;
const KEYWORD_MAX_LENGTH = 128;
const DIRECTOR_MAX_ITEMS = 32;
const ACTOR_MAX_ITEMS = 128;
const COUNTRY_OF_ORIGIN_MAX_ITEMS = 16;
const IN_LANGUAGE_MAX_ITEMS = 16;
const IS_BASED_ON_MAX_ITEMS = 32;
const WIKIDATA_QID_PATTERN = /^Q[1-9]\d*$/u;
const PROVIDER_ARRAY_TRIM_ORDER = [
	'keywords',
	'actor',
	'director',
	'inLanguage',
	'countryOfOrigin',
	'genre',
] as const;

const boundedString = (max: number) => z.string().trim().min(1).max(max);
const httpUrlSchema = boundedString(URL_MAX_LENGTH).refine(isHttpUrl, 'Expected an HTTP(S) URL.');
const imageUrlSchema = boundedString(URL_MAX_LENGTH).refine(
	isPublicHttpsUrl,
	'Expected a public HTTPS image URL.'
);
const personSchema = z
	.object({
		'@type': z.literal('Person').optional(),
		identifier: boundedString(IDENTIFIER_MAX_LENGTH).optional(),
		name: boundedString(NAME_MAX_LENGTH).optional(),
		url: httpUrlSchema.optional(),
	})
	.strip();
const entitySchema = z
	.object({
		'@type': boundedString(128).optional(),
		identifier: boundedString(IDENTIFIER_MAX_LENGTH).optional(),
		name: boundedString(NAME_MAX_LENGTH).optional(),
		url: httpUrlSchema.optional(),
	})
	.strip();
const entityValueSchema = z.union([
	boundedString(NAME_MAX_LENGTH),
	entitySchema,
	z.array(z.union([boundedString(NAME_MAX_LENGTH), entitySchema])).max(AUTHOR_MAX_ITEMS),
]);
const nonEmptyString = z.string().trim().min(1);
const wikidataQidSchema = nonEmptyString.regex(WIKIDATA_QID_PATTERN, 'Expected a Wikidata QID.');
const isoDateSchema = z.iso.date();
const isoDurationSchema = z.iso.duration();
const identifierRungSchema = z
	.object({
		rung: z.string().trim().pipe(z.enum(IDENTITY_RUNG_TOKENS)),
		value: nonEmptyString,
	})
	.strict();
type IdentifierRung = z.infer<typeof identifierRungSchema>;
// Validation has no artifact context: preserve QIDs here so create input and
// replay cannot collapse distinct identities. Provider-backed display translation
// belongs to the corpus projector, where the original evidence is available.
const GENRE_VALUE_MAX_LENGTH = 64;
const TMDB_GENRE_NAMES = new Set<string>(TMDB_GENRES.map((mapping) => mapping.tmdbName));
export function isAdmittedGenreValue(value: string): boolean {
	return (
		value.length <= GENRE_VALUE_MAX_LENGTH &&
		(WIKIDATA_QID_PATTERN.test(value) || TMDB_GENRE_NAMES.has(value))
	);
}
const genreValueSchema = nonEmptyString.max(GENRE_VALUE_MAX_LENGTH).refine(isAdmittedGenreValue, {
	message: 'Expected a Wikidata QID or a pinned TMDB genre name.',
});
const genreSchema = z
	.array(genreValueSchema)
	.transform(deduplicateStrings)
	.pipe(z.array(genreValueSchema).max(GENRE_MAX_ITEMS));
const identifierRungsSchema = z
	.array(identifierRungSchema)
	.transform(deduplicateIdentifierRungs)
	.refine((values) => values.length <= IDENTIFIER_RUNG_MAX_ITEMS, {
		message: `Expected no more than ${IDENTIFIER_RUNG_MAX_ITEMS} identifier rungs.`,
	});
const aggregateRatingSchema = z
	.object({
		ratingValue: z.number(),
		ratingCount: z.number().optional(),
		bestRating: z.number().optional(),
	})
	.strict();

const videoObjectSchema = z
	.object({
		'@type': z.literal('VideoObject'),
		name: boundedString(NAME_MAX_LENGTH).optional(),
		url: z.string().regex(/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/u),
		embedUrl: z.string().regex(/^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{11}$/u),
		thumbnailUrl: z
			.string()
			.regex(/^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\/hqdefault\.jpg$/u),
		inLanguage: boundedString(64).optional(),
		uploadDate: z.iso.datetime().max(64).optional(),
	})
	.strict();

/** Admit stored trailers through the same strict contract as new projections. */
export function parseVideoObject(value: unknown): z.infer<typeof videoObjectSchema> | undefined {
	const parsed = videoObjectSchema.safeParse(value);
	return parsed.success ? parsed.data : undefined;
}

const resolvedDocumentShape = z
	.object({
		'@context': boundedString(256).optional(),
		'@type': boundedString(128).optional(),
		about: z.array(boundedString(SHORT_STRING_MAX_LENGTH)).max(ABOUT_MAX_ITEMS).optional(),
		author: z
			.union([
				boundedString(NAME_MAX_LENGTH),
				personSchema,
				z.array(z.union([boundedString(NAME_MAX_LENGTH), personSchema])).max(AUTHOR_MAX_ITEMS),
			])
			.optional(),
		byArtist: entityValueSchema.optional(),
		actor: z.array(nonEmptyString).max(ACTOR_MAX_ITEMS).optional(),
		aggregateRating: aggregateRatingSchema.optional(),
		countryOfOrigin: z.array(nonEmptyString).max(COUNTRY_OF_ORIGIN_MAX_ITEMS).optional(),
		datePublished: boundedString(SHORT_STRING_MAX_LENGTH).optional(),
		description: z
			.string()
			.trim()
			.min(1)
			.refine((value) => !/<[^>]*>/u.test(value), 'Description must be plain text.')
			.optional(),
		director: z.array(nonEmptyString).max(DIRECTOR_MAX_ITEMS).optional(),
		duration: isoDurationSchema.optional(),
		endDate: isoDateSchema.optional(),
		genre: genreSchema.optional(),
		identifier: boundedString(IDENTIFIER_MAX_LENGTH).optional(),
		/**
		 * Descriptive identity aliases only. Like sameAs, identifierRung is
		 * metadata that never constructs the primary iid. It DOES participate in
		 * alias matching for create-dedupe, so values must be exact.
		 */
		identifierRung: identifierRungsSchema.optional(),
		image: imageUrlSchema.optional(),
		inLanguage: z.array(nonEmptyString).max(IN_LANGUAGE_MAX_ITEMS).optional(),
		inAlbum: entityValueSchema.optional(),
		isBasedOn: z
			.array(z.union([wikidataQidSchema, httpUrlSchema]))
			.max(IS_BASED_ON_MAX_ITEMS)
			.optional(),
		isbn: z
			.union([
				boundedString(SHORT_STRING_MAX_LENGTH),
				z.array(boundedString(SHORT_STRING_MAX_LENGTH)).max(16),
			])
			.optional(),
		isrcCode: boundedString(SHORT_STRING_MAX_LENGTH).optional(),
		keywords: z.array(boundedString(KEYWORD_MAX_LENGTH)).max(KEYWORDS_MAX_ITEMS).optional(),
		name: boundedString(NAME_MAX_LENGTH).optional(),
		sameAs: z.array(httpUrlSchema).max(SAME_AS_MAX_ITEMS).optional(),
		startDate: isoDateSchema.optional(),
		trailer: videoObjectSchema.optional(),
		url: httpUrlSchema.optional(),
	})
	.strip()
	.superRefine((value, ctx) => {
		const byteLength = new TextEncoder().encode(JSON.stringify(value)).byteLength;
		if (byteLength > DATA_RESOLVED_MAX_BYTES) {
			ctx.addIssue({
				code: 'custom',
				message: `dataResolved exceeds ${DATA_RESOLVED_MAX_BYTES} serialized bytes.`,
			});
		}
	});

/** The single bounded resolved-document contract used by process output and KG create input. */
export const dataResolvedSchema = resolvedDocumentShape;
export type DataResolved = z.infer<typeof dataResolvedSchema>;

/** Projects untrusted classifier/provider values onto the schema allowlist. */
export function sanitizeMaterializedDataResolved(value: unknown): DataResolved {
	const candidate = sanitizedDocumentCandidate(value);
	// D-TRAILER-14: the trailer never costs a document its admission.
	if (
		candidate.trailer !== undefined &&
		serializedByteLength(candidate) > DATA_RESOLVED_MAX_BYTES
	) {
		delete candidate.trailer;
	}
	return dataResolvedSchema.parse(candidate);
}

/**
 * Fits provider-appended array entries within the document byte cap before the
 * fail-loud schema parse. Existing entries are protected; if they alone exceed
 * the cap, the schema guard remains the final backstop.
 */
export function sanitizeProjectedDataResolvedWithinBudget(
	value: unknown,
	beforeProviderProjection: unknown
): DataResolved {
	const candidate = sanitizedDocumentCandidate(value);
	const preserved = sanitizedDocumentCandidate(beforeProviderProjection);
	const preservedLengths = Object.fromEntries(
		PROVIDER_ARRAY_TRIM_ORDER.map((key) => [
			key,
			Array.isArray(preserved[key]) ? preserved[key].length : 0,
		])
	) as Record<(typeof PROVIDER_ARRAY_TRIM_ORDER)[number], number>;

	while (serializedByteLength(candidate) > DATA_RESOLVED_MAX_BYTES) {
		const key = PROVIDER_ARRAY_TRIM_ORDER.find((candidateKey) => {
			const entries = candidate[candidateKey];
			return Array.isArray(entries) && entries.length > preservedLengths[candidateKey];
		});
		if (!key) break;
		const entries = candidate[key];
		if (Array.isArray(entries)) {
			entries.pop();
			if (entries.length === 0) delete candidate[key];
		}
	}

	if (serializedByteLength(candidate) > DATA_RESOLVED_MAX_BYTES) {
		delete candidate.trailer;
	}

	return dataResolvedSchema.parse(candidate);
}

function sanitizedDocumentCandidate(value: unknown): Record<string, unknown> {
	const record = asRecord(value) ?? {};
	const schemaType = boundedValue(record['@type'], 128) ?? 'Thing';
	const candidate: Record<string, unknown> = { '@type': schemaType };

	for (const key of MATERIALIZED_FIELDS) {
		const raw = record[key];
		if (raw === undefined || raw === null) continue;
		switch (key) {
			case '@context':
				assignString(candidate, key, raw, 256);
				break;
			case 'name':
				assignString(candidate, key, raw, NAME_MAX_LENGTH);
				break;
			case 'description': {
				const description = plainText(raw);
				if (description) candidate.description = description;
				break;
			}
			case 'identifier':
				assignString(candidate, key, raw, IDENTIFIER_MAX_LENGTH);
				break;
			case 'datePublished':
			case 'isrcCode':
				assignString(candidate, key, raw, SHORT_STRING_MAX_LENGTH);
				break;
			case 'duration':
				assignParsed(candidate, key, raw, isoDurationSchema);
				break;
			case 'endDate':
			case 'startDate':
				assignParsed(candidate, key, raw, isoDateSchema);
				break;
			case 'image': {
				const image = boundedValue(raw, URL_MAX_LENGTH);
				if (image && isPublicHttpsUrl(image)) candidate.image = image;
				break;
			}
			case 'url': {
				const url = boundedValue(raw, URL_MAX_LENGTH);
				if (url && isHttpUrl(url)) candidate.url = url;
				break;
			}
			case 'sameAs':
				candidate.sameAs = stringArray(raw, SAME_AS_MAX_ITEMS, URL_MAX_LENGTH).filter(isHttpUrl);
				break;
			case 'about':
				candidate.about = stringArray(raw, ABOUT_MAX_ITEMS, SHORT_STRING_MAX_LENGTH);
				break;
			case 'actor':
			case 'countryOfOrigin':
			case 'director':
			case 'inLanguage':
			case 'keywords':
				candidate[key] = sanitizedStringArray(raw);
				break;
			case 'genre':
				candidate.genre = sanitizedStringArray(raw, isAdmittedGenreValue);
				break;
			case 'isBasedOn':
				candidate.isBasedOn = sanitizedStringArray(
					raw,
					(entry) => wikidataQidSchema.safeParse(entry).success || isHttpUrl(entry)
				);
				break;
			case 'aggregateRating': {
				candidate.aggregateRating = sanitizedAggregateRating(raw);
				break;
			}
			case 'identifierRung':
				candidate.identifierRung = sanitizedIdentifierRungs(raw);
				break;
			case 'isbn':
				candidate.isbn = Array.isArray(raw)
					? stringArray(raw, 16, SHORT_STRING_MAX_LENGTH)
					: boundedValue(raw, SHORT_STRING_MAX_LENGTH);
				break;
			case 'author':
				candidate.author = sanitizeEntityValue(raw, true);
				break;
			case 'byArtist':
			case 'inAlbum':
				candidate[key] = sanitizeEntityValue(raw, false);
				break;
		}
	}

	// Trailer is a scalar projection, separate from the facet registry. Like other
	// parsed optional fields, discard invalid input before the final schema parse.
	assignParsed(candidate, 'trailer', record.trailer, videoObjectSchema);

	for (const [key, entry] of Object.entries(candidate)) {
		if (entry === undefined || (Array.isArray(entry) && entry.length === 0)) delete candidate[key];
	}
	return candidate;
}

function serializedByteLength(value: unknown): number {
	return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function trimString(value: unknown): unknown {
	return typeof value === 'string' ? value.trim() : value;
}

function deduplicateStrings(values: string[]): string[] {
	return [...new Set(values)];
}

function deduplicateIdentifierRungs(values: IdentifierRung[]): IdentifierRung[] {
	const seen = new Set<string>();
	const result: IdentifierRung[] = [];
	for (const entry of values) {
		const dedupeKey = `${entry.rung}\u0000${entry.value}`;
		if (seen.has(dedupeKey)) continue;
		seen.add(dedupeKey);
		result.push(entry);
	}
	return result;
}

function sanitizedStringArray(
	value: unknown,
	accept: (entry: string) => boolean = () => true
): string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const strings: string[] = [];
	for (const entry of value) {
		const normalized = trimString(entry);
		if (typeof normalized === 'string' && normalized && accept(normalized)) {
			strings.push(normalized);
		}
	}
	return deduplicateStrings(strings);
}

function sanitizedIdentifierRungs(value: unknown): IdentifierRung[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const valid = value.flatMap((entry) => {
		const parsed = identifierRungSchema.safeParse(entry);
		return parsed.success ? [parsed.data] : [];
	});
	return deduplicateIdentifierRungs(valid);
}

function sanitizedAggregateRating(
	value: unknown
): z.infer<typeof aggregateRatingSchema> | undefined {
	const source = asRecord(value);
	if (!source) return undefined;
	const ratingValue = z.number().safeParse(source.ratingValue);
	if (!ratingValue.success) return undefined;
	const ratingCount = z.number().safeParse(source.ratingCount);
	const bestRating = z.number().safeParse(source.bestRating);
	return {
		ratingValue: ratingValue.data,
		...(ratingCount.success ? { ratingCount: ratingCount.data } : {}),
		...(bestRating.success ? { bestRating: bestRating.data } : {}),
	};
}

function assignParsed<T>(
	target: Record<string, unknown>,
	key: string,
	value: unknown,
	schema: z.ZodType<T>
): void {
	const parsed = schema.safeParse(trimString(value));
	if (parsed.success) target[key] = parsed.data;
}

function sanitizeEntityValue(value: unknown, personOnly: boolean): unknown {
	if (typeof value === 'string') return boundedValue(value, NAME_MAX_LENGTH);
	const values = Array.isArray(value) ? value.slice(0, AUTHOR_MAX_ITEMS) : [value];
	const sanitized: Array<string | Record<string, unknown>> = [];
	for (const entry of values) {
		if (typeof entry === 'string') {
			const string = boundedValue(entry, NAME_MAX_LENGTH);
			if (string) sanitized.push(string);
			continue;
		}
		const source = asRecord(entry);
		if (!source) continue;
		const entity: Record<string, unknown> = {};
		assignString(entity, '@type', personOnly ? 'Person' : source['@type'], 128);
		assignString(entity, 'identifier', source.identifier, IDENTIFIER_MAX_LENGTH);
		assignString(entity, 'name', source.name, NAME_MAX_LENGTH);
		const url = boundedValue(source.url, URL_MAX_LENGTH);
		if (url && isHttpUrl(url)) entity.url = url;
		if (Object.keys(entity).length > 0) sanitized.push(entity);
	}
	return Array.isArray(value) ? sanitized : sanitized[0];
}

function assignString(
	target: Record<string, unknown>,
	key: string,
	value: unknown,
	max: number
): void {
	const bounded = boundedValue(value, max);
	if (bounded) target[key] = bounded;
}

function boundedValue(value: unknown, max: number): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] {
	if (!Array.isArray(value)) return [];
	return value.slice(0, maxItems).flatMap((entry) => {
		const bounded = boundedValue(entry, maxLength);
		return bounded ? [bounded] : [];
	});
}

function plainText(value: unknown): string {
	if (typeof value !== 'string') return '';
	return value
		.replace(/<[^>]*>/gu, ' ')
		.replace(/\s+/gu, ' ')
		.trim();
}

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return (
			(url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
		);
	} catch {
		return false;
	}
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}
