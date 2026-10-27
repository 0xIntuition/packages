import type { ResolverAtom } from '../../plugins';
import { resolveDomainHtmlFetch } from '../shared/domain-html/fetch';
import { toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	type createOpenGraphPlatformAdapter,
	fetchOpenGraphMetadata,
	type OpenGraphMetadata,
	type OpenGraphPlatformAdapter,
} from '../shared/opengraph';
import {
	type OpenLibraryWorkLookupOptions,
	type OpenLibraryWorkLookupResult,
	openLibraryLookupFailureError,
} from '../shared/openlibrary-lookup';
import {
	createPlatformStageDiagnostic,
	createPlatformStageOutcome,
	PLATFORM_STAGE_MISS,
} from '../shared/platform';
import {
	buildGoodreadsOpenLibraryWorkAtom,
	GOODREADS_OPENLIBRARY_LOOKUP_STATE,
	type GoodreadsOpenLibraryLookupState,
	type GoodreadsPendingLookup,
	startGoodreadsLookup,
} from './openlibrary-adapter';
import { parseGoodreadsBookUrl } from './url';

export type GoodreadsOpenGraphAdapterOptions = OpenLibraryWorkLookupOptions & {
	fetch?: Parameters<typeof createOpenGraphPlatformAdapter>[0]['fetch'];
	headers?: Record<string, string>;
	resolveHostname?: Parameters<typeof createOpenGraphPlatformAdapter>[0]['resolveHostname'];
};

export type GoodreadsOpenGraphAdapter = OpenGraphPlatformAdapter;

export function createGoodreadsOpenGraphAdapter(
	options: GoodreadsOpenGraphAdapterOptions = {}
): GoodreadsOpenGraphAdapter {
	const fetcher = resolveDomainHtmlFetch(options.fetch);
	return async ({ runtime, domain, classification, canonicalUrl, stageContext, signal }) => {
		if (runtime !== 'server' || domain !== 'goodreads') return PLATFORM_STAGE_MISS;
		const bookId = toStringMaybe(classification.meta.bookId);
		if (!bookId) return PLATFORM_STAGE_MISS;
		const lookupState = stageContext.get(GOODREADS_OPENLIBRARY_LOOKUP_STATE) as
			| GoodreadsOpenLibraryLookupState
			| undefined;
		const pendingId = lookupState && 'kind' in lookupState ? lookupState : undefined;
		const lookups: GoodreadsPendingLookup[] = pendingId ? [pendingId] : [];
		const diagnostics: unknown[] = [];
		try {
			let metadata: OpenGraphMetadata = {};
			try {
				metadata =
					(await fetchOpenGraphMetadata(fetcher, {
						url: canonicalUrl,
						headers: options.headers,
						resolveHostname: options.resolveHostname,
						signal,
					})) ?? {};
			} catch (error) {
				diagnostics.push(error);
			}
			signal?.throwIfAborted();
			const pageEvidence = resolveGoodreadsPageBookEvidence(metadata, bookId);
			const title =
				resolveBookTitle(metadata.title) ??
				resolveBookTitle(pageEvidence.boundBookName) ??
				resolveBookTitle(metadata.documentTitle);
			const fallbackAtom = title
				? buildGoodreadsOpenGraphAtom(bookId, title, canonicalUrl, metadata)
				: null;
			const canBridge =
				!!lookupState && !(lookupState.status === 'failure' && !lookupState.timeout);
			if (canBridge && pageEvidence.status === 'ambiguous') {
				diagnostics.push(
					createPlatformStageDiagnostic(
						'identity_conflict',
						'goodreads_page_isbn_ambiguous: Goodreads Book ISBN evidence disagrees'
					)
				);
			}
			const settledId = pendingId?.result;
			const hardFailure = settledId?.status === 'failure' && settledId.failure.kind !== 'timeout';
			if (settledId?.status === 'hit') {
				return createPlatformStageOutcome(
					buildGoodreadsOpenLibraryWorkAtom(settledId, {
						bookId,
						canonicalUrl,
						stage: 'opengraph',
					}),
					diagnostics
				);
			}
			if (canBridge && !hardFailure && pageEvidence.status === 'resolved') {
				if (fallbackAtom) fallbackAtom.hints = { identifiers: { isbn: pageEvidence.isbn } };
				lookups.push(
					startGoodreadsLookup(
						{ kind: 'isbn', value: pageEvidence.isbn },
						{ ...options, deadlineAtMs: lookupState.deadlineAtMs, minimumRemainingMs: 250, signal }
					)
				);
			}
			const contenders = new Map(
				lookups.map((pending) => [pending, pending.promise.then((result) => ({ pending, result }))])
			);
			while (contenders.size > 0) {
				const { pending, result } = await Promise.race(contenders.values());
				contenders.delete(pending);
				signal?.throwIfAborted();
				if (result.status === 'hit') {
					return createPlatformStageOutcome(
						buildGoodreadsOpenLibraryWorkAtom(result, { bookId, canonicalUrl, stage: 'opengraph' }),
						diagnostics
					);
				}
				recordLookupDiagnostic(result, pending === pendingId ? 'id' : 'isbn', diagnostics);
			}
			return createPlatformStageOutcome(fallbackAtom, diagnostics);
		} finally {
			for (const pending of lookups) pending.controller.abort();
			await Promise.allSettled(lookups.map((pending) => pending.promise));
		}
	};
}

function recordLookupDiagnostic(
	result: OpenLibraryWorkLookupResult,
	route: 'id' | 'isbn',
	diagnostics: unknown[]
): void {
	if (result.status === 'miss' && result.budgetExhausted) {
		diagnostics.push(new Error('openlibrary:budget_exhausted'));
	} else if (result.status === 'failure') {
		diagnostics.push(
			result.failure.kind === 'timeout'
				? createPlatformStageDiagnostic('timeout', `openlibrary_${route}:timeout`)
				: openLibraryLookupFailureError(result)
		);
	}
}

type GoodreadsPageBookEvidence =
	| { status: 'ambiguous'; boundBookName?: string }
	| { status: 'none'; boundBookName?: string }
	| { status: 'resolved'; boundBookName?: string; isbn: string };

function resolveGoodreadsPageBookEvidence(
	metadata: OpenGraphMetadata,
	bookId: string
): GoodreadsPageBookEvidence {
	const evidence = metadata.bookEvidence;
	if (!evidence) {
		return { status: 'none' };
	}

	// Classify every Book record by the identities it carries (ENG-15152 ADV-R2
	// F1/F2, ADV-R3 F1/F2), record-locally and precedence-aware:
	//   bound     — every parseable `@id`/`url` names the requested book;
	//   mixed     — names the requested book AND another one (a hostile `url`
	//               cannot override a contradictory `@id`) → the page fails closed;
	//   other     — names only other Goodreads books (a related / recommended
	//               Book);
	//   opaque    — carries identity values that are NOT valid Goodreads book
	//               URLs (cross-host, protocol-relative, malformed) — never
	//               trusted as anonymous consensus;
	//   anonymous — no `@id`/`url` at all.
	// With a clean bound record present, only bound records feed the bridge and
	// separate related Books are ignored. Without one, any ISBN-bearing other /
	// opaque record blocks the anonymous fallback.
	const boundBooks: typeof evidence.books = [];
	const anonymousBooks: typeof evidence.books = [];
	let mixed = false;
	let blockingFallback = false;
	for (const book of evidence.books) {
		const identities = uniqueStrings(
			[...book.ids, ...book.urls]
				.map((value) => parseGoodreadsBookUrl(value)?.bookId)
				.filter((value): value is string => typeof value === 'string')
		);
		// Anonymous only when the record carried no `@id`/`url` at all; a present
		// but unusable identity (whitespace, non-string, malformed) is opaque.
		if (!book.identityPresent) {
			anonymousBooks.push(book);
			continue;
		}
		if (identities.length === 1 && identities[0] === bookId) {
			boundBooks.push(book);
			continue;
		}
		if (identities.includes(bookId)) {
			mixed = true;
			continue;
		}
		// `other` (names another book) or `opaque` (unparseable identity).
		if (book.isbn.length > 0) blockingFallback = true;
	}
	if (mixed) {
		return { status: 'ambiguous' };
	}
	const boundBookName = boundBooks.map((book) => book.name).find(Boolean);
	if (boundBooks.length > 0) {
		const boundIsbns = uniqueStrings(boundBooks.flatMap((book) => book.isbn));
		if (boundIsbns.length === 0) {
			return { status: 'none', ...(boundBookName ? { boundBookName } : {}) };
		}
		if (boundIsbns.length === 1) {
			return {
				status: 'resolved',
				isbn: boundIsbns[0]!,
				...(boundBookName ? { boundBookName } : {}),
			};
		}

		const agreements = boundIsbns.filter((isbn) => evidence.metaIsbn.includes(isbn));
		if (agreements.length === 1) {
			return {
				status: 'resolved',
				isbn: agreements[0]!,
				...(boundBookName ? { boundBookName } : {}),
			};
		}
		return { status: 'ambiguous', ...(boundBookName ? { boundBookName } : {}) };
	}

	if (blockingFallback) {
		return { status: 'ambiguous' };
	}
	const allIsbns = uniqueStrings([
		...anonymousBooks.flatMap((book) => book.isbn),
		...evidence.metaIsbn,
	]);
	if (allIsbns.length === 0) {
		return { status: 'none' };
	}
	return allIsbns.length === 1
		? { status: 'resolved', isbn: allIsbns[0]! }
		: { status: 'ambiguous' };
}

function uniqueStrings(values: string[]): string[] {
	return [...new Set(values)];
}

function buildGoodreadsOpenGraphAtom(
	bookId: string,
	title: string,
	canonicalUrl: string,
	metadata: OpenGraphMetadata
): ResolverAtom {
	const description = toStringMaybe(metadata.description);
	const atom: ResolverAtom = {
		schemaType: 'Book',
		category: 'thing',
		title,
		description,
		canonicalId: `goodreads:book:${bookId}`,
		sameAs: [canonicalUrl],
		data: {
			'@context': 'https://schema.org/',
			'@type': 'Book',
			name: title,
			identifier: bookId,
			url: canonicalUrl,
			sameAs: [canonicalUrl],
			...(description ? { description } : {}),
			...(metadata.image ? { image: metadata.image } : {}),
		},
	};

	return withPlatformMetadata(atom, 'goodreads', 'book', {
		pluginId: 'goodreads',
		provider: 'goodreads-opengraph',
		sourceUrl: canonicalUrl,
	});
}

function resolveBookTitle(value: string | undefined): string | undefined {
	const title = toStringMaybe(value);
	if (!title || title.toLowerCase() === 'goodreads') {
		return undefined;
	}

	return title.replace(/\s*[|·-]\s*Goodreads\s*$/i, '').trim() || undefined;
}
