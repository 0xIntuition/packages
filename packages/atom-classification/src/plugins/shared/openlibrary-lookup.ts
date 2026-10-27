import type { OpenLibrarySearchOperation } from '@0xintuition/pipeline-runtime/provider-registry';
import type { ResolverAtom } from '../../plugins';
import { decodeHtmlEntities } from './domain-html/document';
import {
	DomainHtmlFetchError,
	type DomainHtmlFetchFailure,
	type DomainHtmlFetchLike,
	type DomainHtmlResolveHostname,
	fetchJsonDocumentResult,
	resolveDomainHtmlFetch,
} from './domain-html/fetch';
import { normalizeIsbn } from './isbn';
import { isCallerCancelledLookup, observeProviderLookup } from './provider-lookup-observer';

const OPENLIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPENLIBRARY_SEARCH_FIELDS = 'key,title,author_name,isbn';
const OPENLIBRARY_TITLE_SEARCH_FIELDS = `${OPENLIBRARY_SEARCH_FIELDS},cover_i`;
const OPENLIBRARY_SEARCH_LIMIT = 10;
const OPENLIBRARY_WORK_KEY = /^\/works\/(OL\d+W)$/i;
const OPENLIBRARY_LOOKUP_BUDGET_MS = 5000;
const OPENLIBRARY_CACHE_MAX_ENTRIES = 2048;
const OPENLIBRARY_HIT_TTL_MS = 24 * 60 * 60 * 1000;
const OPENLIBRARY_MISS_TTL_MS = 10 * 60 * 1000;
const lookupCache = new Map<string, { expiresAtMs: number; result: OpenLibraryWorkLookupResult }>();

export function resetOpenLibraryLookupCacheForTests(): void {
	lookupCache.clear();
}
const UNRESOLVED_HTML_CHARACTER_REFERENCE = /&(?:#[0-9]+|#[xX][0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]+);/;
const OPENLIBRARY_RESPONSE_ORIGINS = new Set([
	'https://openlibrary.org',
	'https://www.openlibrary.org',
]);

export type OpenLibraryWorkLookupOptions = {
	deadlineAtMs?: number;
	budgetMs?: number;
	cache?: false;
	signal?: AbortSignal;
	/** Skip uncached I/O below this remaining budget (Goodreads ISBN bridge). */
	minimumRemainingMs?: number;
	fetch?: DomainHtmlFetchLike;
	resolveHostname?: DomainHtmlResolveHostname;
};

export type OpenLibraryWorkLookupQuery =
	| { kind: 'goodreads'; value: string }
	| { kind: 'isbn'; value: string }
	| { kind: 'title'; value: string };

export type OpenLibraryWorkLookupHit = {
	status: 'hit';
	workKey: string;
	workUrl: string;
	title?: string;
	authorNames: string[];
	isbns: string[];
	coverId?: number;
};

export type OpenLibraryWorkLookupCandidate = {
	workKey: string;
	title: string;
	authorName?: string;
	coverId?: number;
	exact: boolean;
};

export type OpenLibraryWorkLookupResult =
	| OpenLibraryWorkLookupHit
	| { status: 'ambiguous'; candidates: OpenLibraryWorkLookupCandidate[] }
	| { status: 'miss'; budgetExhausted?: true }
	| { status: 'failure'; failure: DomainHtmlFetchFailure; url: string };

export async function resolveOpenLibraryWork(
	query: OpenLibraryWorkLookupQuery,
	options: OpenLibraryWorkLookupOptions = {}
): Promise<OpenLibraryWorkLookupResult> {
	options.signal?.throwIfAborted();
	const normalizedQuery =
		query.kind === 'isbn'
			? { ...query, value: normalizeIsbn(query.value) ?? query.value }
			: query.kind === 'title'
				? { ...query, value: collapseWhitespace(query.value) }
				: query;
	// A title we would not accept as a candidate is not worth a request either:
	// empty after collapsing, or longer than the candidate title cap.
	if (normalizedQuery.kind === 'title' && !isSearchableTitle(normalizedQuery.value)) {
		return { status: 'miss' };
	}
	const cacheKey = `${normalizedQuery.kind}:${normalizedQuery.value}`;
	if (options.cache !== false) {
		const cached = lookupCache.get(cacheKey);
		if (cached && cached.expiresAtMs > Date.now()) {
			observeOpenLibraryLookup(normalizedQuery, cached.result, 'cache');
			return structuredClone(cached.result);
		}
		lookupCache.delete(cacheKey);
	}
	const startedAtMs = Date.now();
	const result = await fetchOpenLibraryWork(normalizedQuery, options);
	// A lookup cancelled by its caller (a lost fallback race) says nothing about the provider.
	if (!isCallerCancelledLookup(options.signal, result)) {
		observeOpenLibraryLookup(normalizedQuery, result, 'live', Date.now() - startedAtMs);
	}
	if (
		options.cache !== false &&
		result.status !== 'failure' &&
		!(result.status === 'miss' && result.budgetExhausted) &&
		!options.signal?.aborted
	) {
		const cached = lookupCache.get(cacheKey);
		// A slower miss must not erase a concurrent hit that is still valid.
		if (
			result.status === 'miss' &&
			cached?.result.status === 'hit' &&
			cached.expiresAtMs > Date.now()
		)
			return result;
		lookupCache.delete(cacheKey);
		if (lookupCache.size >= OPENLIBRARY_CACHE_MAX_ENTRIES) {
			const oldest = lookupCache.keys().next().value;
			if (oldest !== undefined) lookupCache.delete(oldest);
		}
		lookupCache.set(cacheKey, {
			expiresAtMs:
				Date.now() + (result.status === 'hit' ? OPENLIBRARY_HIT_TTL_MS : OPENLIBRARY_MISS_TTL_MS),
			result: structuredClone(result),
		});
	}
	return result;
}

const LOOKUP_OPERATIONS = {
	goodreads: 'search_goodreads_id',
	isbn: 'search_isbn',
	title: 'search_title',
} as const satisfies Record<OpenLibraryWorkLookupQuery['kind'], OpenLibrarySearchOperation>;

function observeOpenLibraryLookup(
	query: OpenLibraryWorkLookupQuery,
	result: OpenLibraryWorkLookupResult,
	source: 'live' | 'cache',
	durationMs?: number
): void {
	observeProviderLookup({
		provider: 'openlibrary',
		operation: LOOKUP_OPERATIONS[query.kind],
		result,
		source,
		...(durationMs === undefined ? {} : { durationMs }),
	});
}

async function fetchOpenLibraryWork(
	query: OpenLibraryWorkLookupQuery,
	options: OpenLibraryWorkLookupOptions
): Promise<OpenLibraryWorkLookupResult> {
	const url = buildOpenLibrarySearchUrl(query);
	const deadlineAtMs =
		options.deadlineAtMs ?? createOpenLibraryLookupDeadlineAtMs(Date.now(), options.budgetMs);
	const remainingMs = Math.max(0, deadlineAtMs - Date.now());
	if (remainingMs < (options.minimumRemainingMs ?? 0))
		return { status: 'miss', budgetExhausted: true };
	if (remainingMs === 0)
		return { status: 'failure', failure: { kind: 'timeout', reason: 'timeout' }, url };
	// The shared fetcher's absolute deadline spans redirects and records true
	// timeouts in the host breaker. Request/loser cancellation stays separate.
	const result = await fetchJsonDocumentResult<unknown>(resolveDomainHtmlFetch(options.fetch), {
		url,
		acceptFinalUrl: isApprovedOpenLibraryResponseUrl,
		deadlineAtMs,
		timeoutMs: remainingMs,
		signal: options.signal,
		...(options.resolveHostname ? { resolveHostname: options.resolveHostname } : {}),
	});
	if (result.ok === false) return { status: 'failure', failure: result.failure, url };

	const payload = toRecord(result.value);
	const docs = Array.isArray(payload?.docs) ? payload.docs : [];
	const workDocs: Array<{ doc: Record<string, unknown>; workKey: string }> = [];
	const distinctWorkKeys = new Set<string>();
	for (const entry of docs) {
		const doc = toRecord(entry);
		const key = readString(doc?.key);
		const workKey = key ? OPENLIBRARY_WORK_KEY.exec(key)?.[1]?.toUpperCase() : undefined;
		if (!workKey) continue;
		distinctWorkKeys.add(workKey);
		workDocs.push({ doc: doc ?? {}, workKey });
	}

	if (query.kind === 'title') {
		return resolveTitleLookup(query.value, payload, workDocs);
	}

	if (distinctWorkKeys.size !== 1) {
		return { status: 'miss' };
	}

	const match = workDocs[0];
	if (!match) {
		return { status: 'miss' };
	}
	const title = readSafeOpenLibraryTitle(match.doc.title);
	const coverId = readCoverId(match.doc.cover_i);
	return {
		status: 'hit',
		workKey: match.workKey,
		workUrl: `https://openlibrary.org/works/${match.workKey}`,
		...(title ? { title } : {}),
		authorNames: readStringArray(match.doc.author_name),
		isbns: readStringArray(match.doc.isbn),
		...(coverId === undefined ? {} : { coverId }),
	};
}

export function createOpenLibraryLookupDeadlineAtMs(
	startedAtMs = Date.now(),
	budgetMs = OPENLIBRARY_LOOKUP_BUDGET_MS
): number {
	return startedAtMs + budgetMs;
}

function isApprovedOpenLibraryResponseUrl(value: string): boolean {
	try {
		return OPENLIBRARY_RESPONSE_ORIGINS.has(new URL(value).origin);
	} catch {
		return false;
	}
}

export function buildOpenLibraryWorkAtom(
	work: OpenLibraryWorkLookupHit,
	input: {
		identifiers?: Readonly<Record<string, string>>;
		providerCanonicalIds?: readonly string[];
		sourceUrls?: readonly string[];
	} = {}
): ResolverAtom {
	const title = work.title ?? `OpenLibrary Work ${work.workKey}`;
	const sameAs = uniqueStrings([...(input.sourceUrls ?? []), work.workUrl]);
	const isbn13 = work.isbns.map(normalizeIsbn).find((isbn) => isbn !== undefined);
	return {
		schemaType: 'Book',
		category: 'thing',
		title,
		canonicalId: `openlibrary:work:${work.workKey}`,
		sameAs,
		hints: {
			identifiers: {
				...input.identifiers,
				olid: work.workKey,
				...(isbn13 ? { isbn: isbn13 } : {}),
			},
			...(input.providerCanonicalIds
				? { providerCanonicalIds: uniqueStrings(input.providerCanonicalIds) }
				: {}),
		},
		data: {
			'@context': 'https://schema.org/',
			'@type': 'Book',
			name: title,
			identifier: `int:olid:${work.workKey}`,
			url: work.workUrl,
			sameAs,
			...(work.authorNames.length > 0
				? {
						author_name: work.authorNames,
						author: work.authorNames.map((name) => ({ '@type': 'Person', name })),
					}
				: {}),
			...(work.isbns.length > 0 ? { isbn: work.isbns } : {}),
			...(work.coverId === undefined ? {} : { coverId: work.coverId }),
		},
	};
}

export function openLibraryLookupFailureError(
	result: Extract<OpenLibraryWorkLookupResult, { status: 'failure' }>
): DomainHtmlFetchError {
	return new DomainHtmlFetchError(result.failure, result.url);
}

function buildOpenLibrarySearchUrl(query: OpenLibraryWorkLookupQuery): string {
	const url = new URL(OPENLIBRARY_SEARCH_URL);
	if (query.kind === 'title') {
		url.searchParams.set('title', normalizeTitleQuery(query.value));
		url.searchParams.set('limit', String(OPENLIBRARY_SEARCH_LIMIT));
		url.searchParams.set('fields', OPENLIBRARY_TITLE_SEARCH_FIELDS);
		return url.href;
	}
	const prefix = query.kind === 'goodreads' ? 'id_goodreads' : 'isbn';
	url.searchParams.set('q', `${prefix}:${query.value}`);
	url.searchParams.set('fields', OPENLIBRARY_SEARCH_FIELDS);
	return url.href;
}

function resolveTitleLookup(
	title: string,
	payload: Record<string, unknown> | undefined,
	workDocs: Array<{ doc: Record<string, unknown>; workKey: string }>
): OpenLibraryWorkLookupResult {
	const comparableTitle = toAsciiAlphanumeric(title);
	const uniqueWorks = new Map<string, OpenLibraryWorkLookupCandidate>();
	// A work row whose title cannot be read is a work we could not compare; it
	// makes the window unprovable below rather than silently vanishing.
	let unreadableRows = 0;
	for (const { doc, workKey } of workDocs) {
		if (uniqueWorks.has(workKey)) continue;
		const candidateTitle = readSafeOpenLibraryTitle(doc.title);
		if (!candidateTitle) {
			unreadableRows += 1;
			continue;
		}
		const authorName = readStringArray(doc.author_name)[0];
		const coverId = readCoverId(doc.cover_i);
		uniqueWorks.set(workKey, {
			workKey,
			title: candidateTitle,
			...(authorName ? { authorName } : {}),
			...(coverId === undefined ? {} : { coverId }),
			exact:
				comparableTitle !== undefined && toAsciiAlphanumeric(candidateTitle) === comparableTitle,
		});
	}

	const allCandidates = [...uniqueWorks.values()];
	const candidates = allCandidates.slice(0, 5);
	const exactWorks = allCandidates.filter((candidate) => candidate.exact);
	const responseDocs = Array.isArray(payload?.docs) ? payload.docs : [];
	// Uniqueness is only provable when the response is the COMPLETE result set:
	// an integer numFound inside the requested window, exactly that many docs
	// returned, every returned row a work row, and every work row comparable.
	// Anything inconsistent (fractional, zero with docs, more matches than rows,
	// a row whose key is not a work, a work whose title is unreadable) cannot
	// rule out a hidden second exact-title work.
	const numFound = readNonnegativeInteger(payload?.numFound);
	const completeWindow =
		numFound !== undefined &&
		numFound <= OPENLIBRARY_SEARCH_LIMIT &&
		responseDocs.length === numFound &&
		workDocs.length === responseDocs.length &&
		unreadableRows === 0;
	if (exactWorks.length === 1 && completeWindow) {
		const exact = exactWorks[0];
		const match = exact ? workDocs.find(({ workKey }) => workKey === exact.workKey) : undefined;
		if (exact && match) {
			return {
				status: 'hit',
				workKey: exact.workKey,
				workUrl: `https://openlibrary.org/works/${exact.workKey}`,
				title: exact.title,
				authorNames: readStringArray(match.doc.author_name),
				isbns: readStringArray(match.doc.isbn),
				...(exact.coverId === undefined ? {} : { coverId: exact.coverId }),
			};
		}
	}

	return responseDocs.length > 0 ? { status: 'ambiguous', candidates } : { status: 'miss' };
}

function normalizeTitleQuery(value: string): string {
	// Slugs strand possessive/contraction letters as their own tokens
	// (`the-handmaid-s-tale`); drop those, but a title that IS a lone `S` or `T`
	// (e.g. "S." by Doug Dorst) must still be queried, never sent as `title=`.
	const stripped = collapseWhitespace(value.replace(/\b[st]\b/gi, ' '));
	return stripped || collapseWhitespace(value);
}

function collapseWhitespace(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function toAsciiAlphanumeric(value: string): string | undefined {
	const decomposed = value.normalize('NFKD').replace(/\p{M}/gu, '');
	for (const character of decomposed) {
		if ((character.codePointAt(0) ?? 0) > 0x7f) return undefined;
	}
	// A title with no letters or digits ("---", "!!!") has no comparison key at
	// all; returning '' would make every such title "exactly" equal.
	return decomposed.toLowerCase().replace(/[^a-z0-9]/g, '') || undefined;
}

function readCoverId(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

// Mirrors the candidate-title cap in readSafeOpenLibraryTitle so the query and
// the candidates it is compared against are admitted on the same terms.
const OPENLIBRARY_TITLE_QUERY_MAX_CODE_POINTS = 200;

function isSearchableTitle(value: string): boolean {
	return value.length > 0 && [...value].length <= OPENLIBRARY_TITLE_QUERY_MAX_CODE_POINTS;
}

function readNonnegativeInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readSafeOpenLibraryTitle(value: unknown): string | undefined {
	const rawTitle = readString(value);
	if (!rawTitle) {
		return undefined;
	}
	let title = rawTitle;
	for (let index = 0; index < 3; index += 1) {
		const decoded = decodeHtmlEntities(title) ?? title;
		if (decoded === title) break;
		title = decoded;
	}

	if (UNRESOLVED_HTML_CHARACTER_REFERENCE.test(title) || Array.from(title).length > 200) {
		return undefined;
	}

	for (const character of title) {
		const codePoint = character.codePointAt(0) ?? 0;
		if (
			codePoint <= 0x1f ||
			(codePoint >= 0x7f && codePoint <= 0x9f) ||
			(codePoint >= 0xfdd0 && codePoint <= 0xfdef) ||
			(codePoint & 0xffff) === 0xfffe ||
			(codePoint & 0xffff) === 0xffff ||
			codePoint === 0x061c ||
			codePoint === 0x200e ||
			codePoint === 0x200f ||
			(codePoint >= 0x202a && codePoint <= 0x202e) ||
			(codePoint >= 0x2066 && codePoint <= 0x2069) ||
			codePoint === 0xfeff ||
			character === '<' ||
			character === '>'
		) {
			return undefined;
		}
	}

	return title;
}

function readStringArray(value: unknown): string[] {
	return Array.isArray(value)
		? uniqueStrings(value.filter((entry): entry is string => typeof entry === 'string'))
		: [];
}

function uniqueStrings(values: readonly string[]): string[] {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
