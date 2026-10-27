import {
	createRequestSlot,
	getProcessRequestSlot,
	type RequestSlot,
} from '@0xintuition/pipeline-runtime/request-slot';
import {
	defineEnrichmentPlugin,
	type EnrichmentPlugin,
	type EnrichmentPluginContext,
} from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import { getIdentifier, getRequestName, getRequestUrl } from '../__shared__/request';
import {
	type OpenLibraryAuthorResponse,
	type OpenLibraryEditionsResponse,
	type OpenLibraryEntityResponse,
	openLibraryAuthorResponseSchema,
	openLibraryEditionsResponseSchema,
	openLibraryEntityResponseSchema,
} from './external';
import {
	entityOperation,
	type ObservedRequestContext,
	type OpenLibraryOperation,
	observeRequest,
} from './request-observer';
import {
	type OpenLibraryAuthorReference,
	type OpenLibraryIdentifiers,
	openLibraryDataSchema,
} from './schema';

type CreateOpenLibraryPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
	baseUrl?: string;
	userAgent?: string;
	/**
	 * Spacing of a PRIVATE slot (tests, tooling). Omitted or equal to the default, the plugin
	 * paces through the process-wide `openlibrary` slot shared by every engine.
	 */
	requestSpacingMs?: number;
	/** An explicit slot (tests); wins over `requestSpacingMs`. */
	requestSlot?: RequestSlot;
	maxAuthorFetches?: number;
};

type OpenLibraryTarget =
	| { kind: 'work'; workOlid: string }
	| { kind: 'edition'; editionOlid: string }
	| { kind: 'isbn'; isbn: string }
	| { kind: 'author'; authorOlid: string };

type BookBuildInput = {
	sourceKind: 'work' | 'edition' | 'isbn';
	target: Exclude<OpenLibraryTarget, { kind: 'author' }>;
	work?: OpenLibraryEntityResponse;
	edition?: OpenLibraryEntityResponse;
	authors: OpenLibraryAuthorReference[];
};

export type OpenLibraryDumpAuthor = {
	key: string;
	name?: string;
	personal_name?: string;
};

export type OpenLibraryDumpHydrationPayload = {
	authors: OpenLibraryDumpAuthor[];
	record: OpenLibraryEntityResponse;
};

const DEFAULT_BASE_URL = 'https://openlibrary.org';
const DEFAULT_USER_AGENT =
	'IntuitionAtomEnrichment/1.0 (+https://intuition.systems; OpenLibrary metadata verifier)';
const DEFAULT_REQUEST_SPACING_MS = 350;
const DEFAULT_MAX_AUTHOR_FETCHES = 5;
const CACHED_ENTITY_OPERATIONS = {
	work: 'work',
	edition: 'book',
	isbn: 'isbn',
} as const satisfies Record<'work' | 'edition' | 'isbn', OpenLibraryOperation>;
const isbn10Pattern = /^[0-9]{9}[0-9X]$/i;
const isbn13Pattern = /^97[89][0-9]{10}$/;
const workOlidPattern = /^OL\d+W$/i;
const editionOlidPattern = /^OL\d+M$/i;
const authorOlidPattern = /^OL\d+A$/i;

/**
 * One slot per process, however many engines and plugin instances exist (the api builds one
 * engine per preset): OpenLibrary's courtesy rate is per client, not per plugin.
 */
function resolveRequestSlot(options: CreateOpenLibraryPluginOptions): RequestSlot {
	if (options.requestSlot) return options.requestSlot;
	const spacing = options.requestSpacingMs;
	if (spacing !== undefined && spacing !== DEFAULT_REQUEST_SPACING_MS) {
		return createRequestSlot({ minSpacingMs: spacing });
	}
	return getProcessRequestSlot('openlibrary', { minSpacingMs: DEFAULT_REQUEST_SPACING_MS });
}

/**
 * OpenLibrary is a no-key Internet Archive service. The plugin identifies
 * itself with a descriptive User-Agent and spaces intra-item requests by
 * default. Book artifacts are emitted for Works, Editions, and ISBN routes.
 * Author URLs/OLIDs are parsed but intentionally not emitted as Person atoms
 * in wave 1; authors are carried as structured references inside Book data.
 * Author fetch failures degrade to OLID/url references. OpenGraph is not a
 * required companion for OpenLibrary because API/dump metadata is rich enough;
 * OG should remain an orchestrator-owned liveness sample if enabled.
 */
export function createOpenLibraryPlugin(
	options: CreateOpenLibraryPluginOptions = {}
): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
	const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
	const maxAuthorFetches = options.maxAuthorFetches ?? DEFAULT_MAX_AUTHOR_FETCHES;
	const requestSlot = resolveRequestSlot(options);

	async function fetchOpenLibraryEntity(
		path: string,
		ctx: EnrichmentPluginContext
	): Promise<OpenLibraryEntityResponse> {
		return await runInRequestSlot(
			entityOperation(path),
			ctx,
			async (signal) =>
				await fetchJsonWithSchema(
					fetcher,
					toOpenLibraryUrl(baseUrl, path),
					openLibraryEntityResponseSchema,
					{
						headers: {
							Accept: 'application/json',
							'User-Agent': userAgent,
						},
						signal,
					}
				)
		);
	}

	async function fetchOpenLibraryAuthor(
		authorOlid: string,
		ctx: EnrichmentPluginContext
	): Promise<OpenLibraryAuthorResponse> {
		return await runInRequestSlot(
			'author',
			ctx,
			async (signal) =>
				await fetchJsonWithSchema(
					fetcher,
					toOpenLibraryUrl(baseUrl, `/authors/${authorOlid}.json`),
					openLibraryAuthorResponseSchema,
					{
						headers: {
							Accept: 'application/json',
							'User-Agent': userAgent,
						},
						signal,
					}
				)
		);
	}

	async function fetchOpenLibraryEditions(
		workOlid: string,
		ctx: EnrichmentPluginContext
	): Promise<OpenLibraryEditionsResponse> {
		return await runInRequestSlot(
			'editions',
			ctx,
			async (signal) =>
				await fetchJsonWithSchema(
					fetcher,
					toOpenLibraryUrl(baseUrl, `/works/${workOlid}/editions.json?limit=20`),
					openLibraryEditionsResponseSchema,
					{
						headers: {
							Accept: 'application/json',
							'User-Agent': userAgent,
						},
						signal,
					}
				)
		);
	}

	function runInRequestSlot<T>(
		operation: OpenLibraryOperation,
		context: ObservedRequestContext,
		request: (signal: AbortSignal) => Promise<T>
	): Promise<T> {
		return observeRequest(requestSlot, operation, context, request);
	}

	return defineEnrichmentPlugin({
		id: 'openlibrary',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['openlibrary'],
		priority: options.priority ?? 56,
		TTL: options.TTL ?? 43_200,

		observability: {
			provider: 'openlibrary',
			// A cached run stands in for the entity fetch its target selects.
			cacheOperations(request) {
				const target = resolveOpenLibraryTarget(request);
				return target && target.kind !== 'author' ? [CACHED_ENTITY_OPERATIONS[target.kind]] : [];
			},
		},

		supports(request: EnrichmentRequest) {
			const target = resolveOpenLibraryTarget(request);
			return target !== undefined && target.kind !== 'author';
		},

		async enrich(request, ctx) {
			const target = resolveOpenLibraryTarget(request);
			if (!target || target.kind === 'author') {
				return [];
			}

			const hydrated = await hydrateBookTarget(
				target,
				fetchOpenLibraryEntity,
				fetchOpenLibraryEditions,
				ctx
			);
			if (!hydrated.work && !hydrated.edition) {
				return [];
			}

			const authorOlids = collectAuthorOlids(hydrated.edition, hydrated.work);
			const authors = await hydrateAuthors(
				authorOlids,
				maxAuthorFetches,
				fetchOpenLibraryAuthor,
				ctx
			);
			return [
				buildOpenLibraryArtifact({
					fetchedAt: ctx.now(),
					sourceKind: target.kind,
					target,
					work: hydrated.work,
					edition: hydrated.edition,
					authors,
				}),
			];
		},
	});
}

/**
 * Builds the same artifact as the live work API path from a works-dump record
 * plus locally joined author records. The first five author names are retained
 * because the API plugin intentionally caps author fan-out at five requests.
 */
export function buildOpenLibraryWorkArtifactFromDump(input: {
	authors: OpenLibraryDumpAuthor[];
	fetchedAt: string;
	record: unknown;
}) {
	const work = openLibraryEntityResponseSchema.parse(input.record);
	const workOlid = extractOlidFromKey(toStringMaybe(work.key), 'work');
	if (!workOlid) {
		throw new Error('OpenLibrary dump hydrate requires record.key to be a work OLID path.');
	}
	const authorByOlid = new Map<string, OpenLibraryDumpAuthor>();
	for (const author of input.authors) {
		const authorOlid = extractOlidFromKey(author.key, 'author');
		if (authorOlid) {
			authorByOlid.set(authorOlid, author);
		}
	}
	const authors = collectAuthorOlids(undefined, work).map((olid, index) => {
		const author = index < DEFAULT_MAX_AUTHOR_FETCHES ? authorByOlid.get(olid) : undefined;
		return {
			olid,
			name: author
				? (toStringMaybe(author.name) ?? toStringMaybe(author.personal_name))
				: undefined,
			url: openLibraryAuthorUrl(olid),
		};
	});

	return buildOpenLibraryArtifact({
		authors,
		fetchedAt: input.fetchedAt,
		sourceKind: 'work',
		target: { kind: 'work', workOlid },
		work,
	});
}

function buildOpenLibraryArtifact(input: BookBuildInput & { fetchedAt: string }) {
	const data = buildBookData(input);
	return {
		artifact_type: 'openlibrary' as const,
		data,
		meta: {
			fetchedAt: input.fetchedAt,
			pluginId: 'openlibrary',
			provider: 'openlibrary',
			sourceUrl: data.openLibraryUrl,
		},
	};
}

export function parseOpenLibraryTargetFromUrl(url: string): OpenLibraryTarget | undefined {
	try {
		const parsed = new URL(url);
		if (!isOpenLibraryHost(parsed.hostname)) {
			return undefined;
		}

		const normalizedPathname = decodeURIComponent(parsed.pathname).replace(/\.json$/i, '');
		const workMatch = normalizedPathname.match(/^\/works\/(OL\d+W)(?:\/|$)/i);
		if (workMatch?.[1]) {
			return { kind: 'work', workOlid: normalizeOlid(workMatch[1]) };
		}

		const editionMatch = normalizedPathname.match(/^\/books\/(OL\d+M)(?:\/|$)/i);
		if (editionMatch?.[1]) {
			return { kind: 'edition', editionOlid: normalizeOlid(editionMatch[1]) };
		}

		const authorMatch = normalizedPathname.match(/^\/authors\/(OL\d+A)(?:\/|$)/i);
		if (authorMatch?.[1]) {
			return { kind: 'author', authorOlid: normalizeOlid(authorMatch[1]) };
		}

		const isbnMatch = normalizedPathname.match(/^\/isbn\/([^/]+)(?:\/|$)/i);
		const isbn = isbnMatch?.[1] ? normalizeIsbn(isbnMatch[1]) : undefined;
		if (isbn) {
			return { kind: 'isbn', isbn };
		}

		return undefined;
	} catch {
		return undefined;
	}
}

function resolveOpenLibraryTarget(request: EnrichmentRequest): OpenLibraryTarget | undefined {
	const openLibraryIdentifier = getIdentifier(
		request,
		'openlibrary',
		'openLibrary',
		'openlibraryOlid',
		'openLibraryOlid',
		'olid',
		'workOlid',
		'editionOlid',
		'authorOlid'
	);
	if (openLibraryIdentifier) {
		const target = parseOpenLibraryReference(openLibraryIdentifier);
		if (target) {
			return target;
		}
	}

	const isbnIdentifier = getIdentifier(request, 'isbn', 'isbn10', 'isbn13', 'ISBN');
	if (isbnIdentifier) {
		const isbn = normalizeIsbn(isbnIdentifier);
		if (isbn) {
			return { kind: 'isbn', isbn };
		}
	}

	const url = getRequestUrl(request);
	if (url) {
		const target = parseOpenLibraryTargetFromUrl(url);
		if (target) {
			return target;
		}
	}

	const jsonLdIsbn = readJsonLdIsbn(request.input.jsonLd);
	if (jsonLdIsbn) {
		return { kind: 'isbn', isbn: jsonLdIsbn };
	}

	const name = getRequestName(request);
	return name ? parseOpenLibraryReference(name) : undefined;
}

function parseOpenLibraryReference(value: string): OpenLibraryTarget | undefined {
	const trimmed = value.trim();
	if (/^https?:\/\//i.test(trimmed)) {
		return parseOpenLibraryTargetFromUrl(trimmed);
	}

	const withoutProvider = trimmed.replace(/^openlibrary(?::|\s)+/i, '');
	const workMatch = withoutProvider.match(/^(?:work|works)(?::|\s)+([A-Z0-9]+)$/i);
	if (workMatch?.[1] && workOlidPattern.test(workMatch[1])) {
		return { kind: 'work', workOlid: normalizeOlid(workMatch[1]) };
	}

	const editionMatch = withoutProvider.match(/^(?:edition|book|books)(?::|\s)+([A-Z0-9]+)$/i);
	if (editionMatch?.[1] && editionOlidPattern.test(editionMatch[1])) {
		return { kind: 'edition', editionOlid: normalizeOlid(editionMatch[1]) };
	}

	const authorMatch = withoutProvider.match(/^(?:author|authors)(?::|\s)+([A-Z0-9]+)$/i);
	if (authorMatch?.[1] && authorOlidPattern.test(authorMatch[1])) {
		return { kind: 'author', authorOlid: normalizeOlid(authorMatch[1]) };
	}

	if (workOlidPattern.test(withoutProvider)) {
		return { kind: 'work', workOlid: normalizeOlid(withoutProvider) };
	}
	if (editionOlidPattern.test(withoutProvider)) {
		return { kind: 'edition', editionOlid: normalizeOlid(withoutProvider) };
	}
	if (authorOlidPattern.test(withoutProvider)) {
		return { kind: 'author', authorOlid: normalizeOlid(withoutProvider) };
	}

	const isbn = normalizeIsbn(withoutProvider);
	return isbn ? { kind: 'isbn', isbn } : undefined;
}

async function hydrateBookTarget(
	target: Exclude<OpenLibraryTarget, { kind: 'author' }>,
	fetchEntity: (path: string, ctx: EnrichmentPluginContext) => Promise<OpenLibraryEntityResponse>,
	fetchEditions: (
		workOlid: string,
		ctx: EnrichmentPluginContext
	) => Promise<OpenLibraryEditionsResponse>,
	ctx: EnrichmentPluginContext
): Promise<{ work?: OpenLibraryEntityResponse; edition?: OpenLibraryEntityResponse }> {
	if (target.kind === 'work') {
		const work = await fetchEntity(`/works/${target.workOlid}.json`, ctx);
		if (hasPositiveOpenLibraryCover(work)) {
			return { work };
		}
		try {
			const editions = await fetchEditions(target.workOlid, ctx);
			return { edition: selectBestOpenLibraryCoverEdition(editions.entries), work };
		} catch (error) {
			ctx.logger?.warn('OpenLibrary editions lookup failed; keeping work metadata.', {
				error: getErrorMessage(error),
				workOlid: target.workOlid,
			});
			return { work };
		}
	}

	const edition =
		target.kind === 'edition'
			? await fetchEntity(`/books/${target.editionOlid}.json`, ctx)
			: await fetchEntity(`/isbn/${target.isbn}.json`, ctx);
	const workOlid = extractFirstWorkOlid(edition);
	const work = workOlid ? await fetchEntity(`/works/${workOlid}.json`, ctx) : undefined;
	return { work, edition };
}

export function selectBestOpenLibraryCoverEdition(
	editions: readonly OpenLibraryEntityResponse[]
): OpenLibraryEntityResponse | undefined {
	return editions.filter(hasPositiveOpenLibraryCover).sort((left, right) => {
		const descriptionDifference =
			Number(hasOpenLibraryDescription(right)) - Number(hasOpenLibraryDescription(left));
		if (descriptionDifference !== 0) {
			return descriptionDifference;
		}
		const coverDifference =
			Number(hasPositiveOpenLibraryCover(right)) - Number(hasPositiveOpenLibraryCover(left));
		if (coverDifference !== 0) {
			return coverDifference;
		}
		const publishYearDifference = openLibraryPublishYear(right) - openLibraryPublishYear(left);
		if (publishYearDifference !== 0) {
			return publishYearDifference;
		}
		return (toStringMaybe(left.key) ?? '').localeCompare(toStringMaybe(right.key) ?? '');
	})[0];
}

function hasPositiveOpenLibraryCover(entity: OpenLibraryEntityResponse): boolean {
	return toCoverIds(entity.covers).length > 0;
}

function hasOpenLibraryDescription(entity: OpenLibraryEntityResponse): boolean {
	return normalizeDescription(entity.description) !== undefined;
}

function openLibraryPublishYear(entity: OpenLibraryEntityResponse): number {
	const explicit = Number(entity.publish_year);
	if (Number.isSafeInteger(explicit) && explicit > 0) {
		return explicit;
	}
	const publishDate = toStringMaybe(entity.publish_date);
	const year = Number(publishDate?.match(/\b([12][0-9]{3})\b/)?.[1]);
	return Number.isSafeInteger(year) && year > 0 ? year : 0;
}

async function hydrateAuthors(
	authorOlids: string[],
	maxAuthorFetches: number,
	fetchAuthor: (
		authorOlid: string,
		ctx: EnrichmentPluginContext
	) => Promise<OpenLibraryAuthorResponse>,
	ctx: EnrichmentPluginContext
): Promise<OpenLibraryAuthorReference[]> {
	const authors: OpenLibraryAuthorReference[] = [];
	for (const authorOlid of authorOlids.slice(0, maxAuthorFetches)) {
		try {
			const author = await fetchAuthor(authorOlid, ctx);
			authors.push({
				olid: authorOlid,
				name: toStringMaybe(author.name) ?? toStringMaybe(author.personal_name),
				url: openLibraryAuthorUrl(authorOlid),
			});
		} catch (error) {
			ctx.logger?.warn('OpenLibrary author lookup failed; keeping OLID reference.', {
				authorOlid,
				error: getErrorMessage(error),
			});
			authors.push({
				olid: authorOlid,
				url: openLibraryAuthorUrl(authorOlid),
			});
		}
	}

	for (const authorOlid of authorOlids.slice(maxAuthorFetches)) {
		authors.push({
			olid: authorOlid,
			url: openLibraryAuthorUrl(authorOlid),
		});
	}

	return authors;
}

function buildBookData(input: BookBuildInput) {
	const workOlid =
		extractOlidFromKey(toStringMaybe(input.work?.key), 'work') ??
		(input.target.kind === 'work' ? input.target.workOlid : undefined);
	const editionOlid =
		extractOlidFromKey(toStringMaybe(input.edition?.key), 'edition') ??
		(input.target.kind === 'edition' ? input.target.editionOlid : undefined);
	const workUrl = workOlid ? openLibraryWorkUrl(workOlid) : undefined;
	const editionUrl = editionOlid ? openLibraryEditionUrl(editionOlid) : undefined;
	const entityType = input.sourceKind === 'work' ? 'work' : input.edition ? 'edition' : 'work';
	const openLibraryUrl = entityType === 'edition' ? editionUrl : workUrl;
	const title =
		toStringMaybe(input.edition?.title) ??
		toStringMaybe(input.work?.title) ??
		(editionOlid ? `OpenLibrary Edition ${editionOlid}` : undefined) ??
		(workOlid ? `OpenLibrary Work ${workOlid}` : 'OpenLibrary Book');
	const subtitle = toStringMaybe(input.edition?.subtitle);
	const description = normalizeDescription(input.work?.description ?? input.edition?.description);
	const subjects = uniqueStrings([
		...toStringArray(input.work?.subjects),
		...toStringArray(input.edition?.subjects),
	]);
	const publishers = toStringArray(input.edition?.publishers);
	const coverIds = uniqueNumbers([
		...toCoverIds(input.edition?.covers),
		...toCoverIds(input.work?.covers),
	]);
	const coverId = coverIds[0];
	const coverImageUrls = coverId ? toCoverImageUrls(coverId) : undefined;
	const authorOlids = uniqueStrings(input.authors.map((author) => author.olid));
	const isbn10 = identifierArray(input.edition?.isbn_10);
	const isbn13 = identifierArray(input.edition?.isbn_13);
	const oclc = uniqueStrings([
		...identifierArray(input.edition?.oclc_numbers),
		...identifierArray(toRecordMaybe(input.edition?.identifiers)?.oclc),
	]);
	const lccn = uniqueStrings([
		...identifierArray(input.edition?.lccn),
		...identifierArray(toRecordMaybe(input.edition?.identifiers)?.lccn),
	]);
	const identifiers = buildIdentifiers({
		workOlid,
		editionOlid,
		authorOlids,
		isbn10,
		isbn13,
		oclc,
		lccn,
	});
	const sameAs = uniqueStrings([
		workUrl,
		editionUrl,
		...isbn10.map(openLibraryIsbnUrl),
		...isbn13.map(openLibraryIsbnUrl),
	]).filter(isHttpUrl);
	const datePublished =
		toStringMaybe(input.edition?.publish_date) ?? toStringMaybe(input.work?.first_publish_date);

	return openLibraryDataSchema.parse({
		entityType,
		sourceKind: input.sourceKind,
		openLibraryUrl: openLibraryUrl ?? editionUrl ?? workUrl ?? DEFAULT_BASE_URL,
		workUrl,
		editionUrl,
		workOlid,
		editionOlid,
		title,
		subtitle,
		name: title,
		description,
		subjects: subjects.length > 0 ? subjects : undefined,
		authors: input.authors.length > 0 ? input.authors : undefined,
		firstPublishDate: toStringMaybe(input.work?.first_publish_date),
		publishDate: toStringMaybe(input.edition?.publish_date),
		publishers: publishers.length > 0 ? publishers : undefined,
		coverId,
		coverImageUrls,
		authorOlids: authorOlids.length > 0 ? authorOlids : undefined,
		isbn10: isbn10.length > 0 ? isbn10 : undefined,
		isbn13: isbn13.length > 0 ? isbn13 : undefined,
		oclc: oclc.length > 0 ? oclc : undefined,
		lccn: lccn.length > 0 ? lccn : undefined,
		identifiers,
		schemaOrg: {
			'@context': 'https://schema.org',
			'@type': 'Book',
			name: title,
			url: openLibraryUrl ?? editionUrl ?? workUrl ?? DEFAULT_BASE_URL,
			author:
				input.authors.length > 0
					? input.authors.map((author) => ({
							'@type': 'Person',
							identifier: author.olid,
							name: author.name,
							url: author.url,
						}))
					: undefined,
			datePublished,
			description,
			image: coverImageUrls?.large,
			isbn: [...isbn13, ...isbn10].length > 0 ? [...isbn13, ...isbn10] : undefined,
			sameAs: sameAs.length > 0 ? sameAs : undefined,
		},
	});
}

function buildIdentifiers(input: {
	workOlid?: string;
	editionOlid?: string;
	authorOlids: string[];
	isbn10: string[];
	isbn13: string[];
	oclc: string[];
	lccn: string[];
}): OpenLibraryIdentifiers | undefined {
	const identifiers: OpenLibraryIdentifiers = {};
	if (input.workOlid) identifiers.workOlid = input.workOlid;
	if (input.editionOlid) identifiers.editionOlid = input.editionOlid;
	if (input.authorOlids.length > 0) identifiers.authorOlids = input.authorOlids;
	if (input.isbn10.length > 0) identifiers.isbn10 = input.isbn10;
	if (input.isbn13.length > 0) identifiers.isbn13 = input.isbn13;
	if (input.oclc.length > 0) identifiers.oclc = input.oclc;
	if (input.lccn.length > 0) identifiers.lccn = input.lccn;
	return Object.keys(identifiers).length > 0 ? identifiers : undefined;
}

function collectAuthorOlids(
	edition: OpenLibraryEntityResponse | undefined,
	work: OpenLibraryEntityResponse | undefined
): string[] {
	const authorOlids = [
		...extractAuthorOlids(edition?.authors),
		...extractAuthorOlids(work?.authors),
	];
	return uniqueStrings(authorOlids);
}

function extractAuthorOlids(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((entry) => {
			const record = toRecordMaybe(entry);
			const directKey = toStringMaybe(record?.key);
			const nestedKey = toStringMaybe(toRecordMaybe(record?.author)?.key);
			return extractOlidFromKey(directKey ?? nestedKey, 'author');
		})
		.filter((entry): entry is string => entry !== undefined);
}

function extractFirstWorkOlid(edition: OpenLibraryEntityResponse): string | undefined {
	const works = edition.works;
	if (!Array.isArray(works)) {
		return undefined;
	}

	for (const work of works) {
		const workOlid = extractOlidFromKey(toStringMaybe(toRecordMaybe(work)?.key), 'work');
		if (workOlid) {
			return workOlid;
		}
	}

	return undefined;
}

function extractOlidFromKey(
	key: string | undefined,
	kind: 'work' | 'edition' | 'author'
): string | undefined {
	if (!key) {
		return undefined;
	}

	const patterns = {
		author: /^\/authors\/(OL\d+A)$/i,
		edition: /^\/books\/(OL\d+M)$/i,
		work: /^\/works\/(OL\d+W)$/i,
	} as const;
	const match = key.match(patterns[kind]);
	return match?.[1] ? normalizeOlid(match[1]) : undefined;
}

function normalizeDescription(value: unknown): string | undefined {
	const direct = toStringMaybe(value);
	if (direct) {
		return direct;
	}

	const record = toRecordMaybe(value);
	return toStringMaybe(record?.value);
}

function normalizeIsbn(value: string): string | undefined {
	const compact = value
		.trim()
		.replace(/^isbn(?::|\s)+/i, '')
		.replace(/\.json$/i, '')
		.replace(/[-\s]/g, '')
		.toUpperCase();
	if (isbn10Pattern.test(compact) || isbn13Pattern.test(compact)) {
		return compact;
	}
	return undefined;
}

function readJsonLdIsbn(jsonLd: Record<string, unknown>): string | undefined {
	const isbn = jsonLd.isbn;
	if (typeof isbn === 'string') {
		return normalizeIsbn(isbn);
	}
	if (Array.isArray(isbn)) {
		for (const entry of isbn) {
			if (typeof entry !== 'string') {
				continue;
			}
			const normalized = normalizeIsbn(entry);
			if (normalized) {
				return normalized;
			}
		}
	}
	return undefined;
}

function identifierArray(value: unknown): string[] {
	if (typeof value === 'string' || typeof value === 'number') {
		return uniqueStrings([String(value)]);
	}
	if (!Array.isArray(value)) {
		return [];
	}
	return uniqueStrings(
		value
			.map((entry) => (typeof entry === 'string' || typeof entry === 'number' ? String(entry) : ''))
			.filter(Boolean)
	);
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return uniqueStrings(value.map(toStringMaybe).filter((entry): entry is string => !!entry));
}

function toCoverIds(value: unknown): number[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter(
		(entry): entry is number => typeof entry === 'number' && Number.isInteger(entry) && entry > 0
	);
}

function toRecordMaybe(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function toStringMaybe(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
	return [...new Set(values.filter((value): value is string => !!value && value.length > 0))];
}

function uniqueNumbers(values: number[]): number[] {
	return [...new Set(values)];
}

function isHttpUrl(value: string | undefined): value is string {
	if (!value) {
		return false;
	}
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'https:' || parsed.protocol === 'http:';
	} catch {
		return false;
	}
}

function isOpenLibraryHost(hostname: string): boolean {
	const normalized = hostname.toLowerCase();
	return normalized === 'openlibrary.org' || normalized.endsWith('.openlibrary.org');
}

function normalizeOlid(value: string): string {
	return value.toUpperCase();
}

function toOpenLibraryUrl(baseUrl: string, path: string): string {
	return new URL(path, baseUrl).toString();
}

function openLibraryWorkUrl(workOlid: string): string {
	return `${DEFAULT_BASE_URL}/works/${workOlid}`;
}

function openLibraryEditionUrl(editionOlid: string): string {
	return `${DEFAULT_BASE_URL}/books/${editionOlid}`;
}

function openLibraryAuthorUrl(authorOlid: string): string {
	return `${DEFAULT_BASE_URL}/authors/${authorOlid}`;
}

function openLibraryIsbnUrl(isbn: string): string {
	return `${DEFAULT_BASE_URL}/isbn/${isbn}`;
}

function toCoverImageUrls(coverId: number) {
	return {
		small: `https://covers.openlibrary.org/b/id/${coverId}-S.jpg`,
		medium: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
		large: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
	};
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
