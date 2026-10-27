import type { ResolverAtom } from '../../plugins';
import type { ClassificationClientClassificationHint, ClassificationRuntime } from '../../types';
import {
	extractDocumentTitle,
	extractJsonLdRecordsByType,
	extractMetaContent,
	normalizeWhitespace,
} from './domain-html/document';
import {
	DomainHtmlFetchError,
	type DomainHtmlFetchLike,
	type DomainHtmlResolveHostname,
	fetchHtmlDocumentResult,
	resolveDomainHtmlFetch,
} from './domain-html/fetch';
import { normalizeIsbn } from './isbn';
import {
	PLATFORM_STAGE_MISS,
	type PlatformDomain,
	type PlatformStageAdapter,
	type PlatformStageOutcome,
} from './platform';

export type OpenGraphMetadata = {
	title?: string;
	description?: string;
	image?: string;
	url?: string;
	siteName?: string;
	twitterSite?: string;
	documentTitle?: string;
	identifiers?: {
		isbn?: string[];
	};
	bookEvidence?: {
		books: Array<{
			ids: string[];
			urls: string[];
			/**
			 * True when the record carried ANY `@id`/`url` value (even malformed,
			 * whitespace, or non-string). Consumers must treat a record as
			 * identity-free only when this is false — a present-but-unusable
			 * identity is opaque, not anonymous.
			 */
			identityPresent: boolean;
			name?: string;
			isbn: string[];
		}>;
		metaIsbn: string[];
	};
};

export type OpenGraphPlatformAdapterInput = {
	runtime: ClassificationRuntime;
	domain: PlatformDomain;
	classification: ClassificationClientClassificationHint;
	canonicalUrl: string;
	metadata: OpenGraphMetadata;
	stageContext: Map<unknown, unknown>;
};

export type OpenGraphPlatformAdapterOptions = {
	acceptFinalUrl?: (url: string) => boolean;
	fetch?: DomainHtmlFetchLike;
	domains?: PlatformDomain[];
	headers?: Record<string, string>;
	resolveHostname?: DomainHtmlResolveHostname;
	map: (
		input: OpenGraphPlatformAdapterInput
	) =>
		| ResolverAtom
		| PlatformStageOutcome
		| null
		| undefined
		| Promise<ResolverAtom | PlatformStageOutcome | null | undefined>;
};

export type OpenGraphPlatformAdapter = PlatformStageAdapter;

export function createOpenGraphPlatformAdapter(
	options: OpenGraphPlatformAdapterOptions
): OpenGraphPlatformAdapter {
	const fetcher = resolveDomainHtmlFetch(options.fetch);

	return async ({ runtime, domain, classification, canonicalUrl, signal, stageContext }) => {
		if (runtime !== 'server') {
			return PLATFORM_STAGE_MISS;
		}

		if (options.domains && !options.domains.includes(domain)) {
			return PLATFORM_STAGE_MISS;
		}

		const metadata = await fetchOpenGraphMetadata(fetcher, {
			url: canonicalUrl,
			acceptFinalUrl: options.acceptFinalUrl,
			headers: options.headers,
			resolveHostname: options.resolveHostname,
			signal,
		});
		if (!metadata) {
			return PLATFORM_STAGE_MISS;
		}

		return (
			(await options.map({
				runtime,
				domain,
				classification,
				canonicalUrl,
				metadata,
				stageContext,
			})) ?? PLATFORM_STAGE_MISS
		);
	};
}

export async function fetchOpenGraphMetadata(
	fetcher: DomainHtmlFetchLike,
	input: {
		url: string;
		acceptFinalUrl?: (url: string) => boolean;
		headers?: Record<string, string>;
		signal?: AbortSignal;
		timeoutMs?: number;
		resolveHostname?: DomainHtmlResolveHostname;
	}
): Promise<OpenGraphMetadata | undefined> {
	const result = await fetchHtmlDocumentResult(fetcher, input);
	if (result.ok === false) {
		throw new DomainHtmlFetchError(result.failure, input.url);
	}

	return extractOpenGraphMetadata(result.value);
}

export function extractOpenGraphMetadata(html: string): OpenGraphMetadata | undefined {
	const bookEvidence = extractBookEvidence(html);
	const metadata: OpenGraphMetadata = {
		title: firstDefined(
			normalizeWhitespace(extractMetaContent(html, 'og:title')),
			normalizeWhitespace(extractMetaContent(html, 'twitter:title'))
		),
		description: firstDefined(
			normalizeWhitespace(extractMetaContent(html, 'og:description')),
			normalizeWhitespace(extractMetaContent(html, 'twitter:description'))
		),
		image: normalizeHttpUrl(
			firstDefined(extractMetaContent(html, 'og:image'), extractMetaContent(html, 'twitter:image'))
		),
		url: normalizeHttpUrl(extractMetaContent(html, 'og:url')),
		siteName: normalizeWhitespace(extractMetaContent(html, 'og:site_name')),
		twitterSite: normalizeWhitespace(extractMetaContent(html, 'twitter:site')),
		documentTitle: normalizeWhitespace(extractDocumentTitle(html)),
		identifiers: extractBookIdentifiers(bookEvidence),
		...(bookEvidence.books.length > 0 || bookEvidence.metaIsbn.length > 0 ? { bookEvidence } : {}),
	};

	return hasOpenGraphSignals(metadata) ? metadata : undefined;
}

function hasOpenGraphSignals(metadata: OpenGraphMetadata): boolean {
	return !!(
		metadata.title ||
		metadata.description ||
		metadata.image ||
		metadata.url ||
		metadata.siteName ||
		metadata.twitterSite ||
		metadata.identifiers?.isbn?.length ||
		metadata.bookEvidence?.books.length
	);
}

function extractBookIdentifiers(
	evidence: NonNullable<OpenGraphMetadata['bookEvidence']>
): OpenGraphMetadata['identifiers'] {
	const isbn = uniqueStrings([
		...evidence.books.flatMap((book) => book.isbn),
		...evidence.metaIsbn,
	]);
	return isbn.length > 0 ? { isbn } : undefined;
}

function extractBookEvidence(html: string): NonNullable<OpenGraphMetadata['bookEvidence']> {
	const books = extractJsonLdRecordsByType(html, 'Book').map((record) => ({
		ids: readStringValues(record['@id']),
		urls: readStringValues(record.url),
		identityPresent: hasIdentityValue(record['@id']) || hasIdentityValue(record.url),
		...(typeof record.name === 'string' && record.name.trim() ? { name: record.name.trim() } : {}),
		isbn: uniqueStrings(readStringValues(record.isbn).map(normalizeIsbn).filter(isDefined)),
	}));
	const metaIsbn = uniqueStrings(
		[extractMetaContent(html, 'books:isbn')]
			.map((value) => (value ? normalizeIsbn(value) : undefined))
			.filter(isDefined)
	);
	return { books, metaIsbn };
}

/** A value counts as a present identity unless it is absent, null, or an empty array. */
function hasIdentityValue(value: unknown): boolean {
	if (value === undefined || value === null) return false;
	if (Array.isArray(value)) return value.length > 0;
	return true;
}

function readStringValues(value: unknown): string[] {
	if (typeof value === 'string') {
		return value.trim() ? [value.trim()] : [];
	}
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.filter((entry): entry is string => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function isDefined(value: string | undefined): value is string {
	return value !== undefined;
}

function uniqueStrings(values: string[]): string[] {
	return [...new Set(values)];
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
	return values.find((value) => typeof value === 'string' && value.length > 0);
}

function normalizeHttpUrl(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	try {
		const parsed = new URL(value);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return undefined;
		}

		return parsed.toString();
	} catch {
		return undefined;
	}
}
