import { tryParseUrl } from '../shared/helpers';

// Goodreads uses two-letter top-level segments only as locale namespaces; its
// real non-locale route families are three or more letters.
const GOODREADS_BOOK_PATH =
	/^\/(?:[a-z]{2}\/)?book\/show\/(\d+)(?:[.-]([^/]+)(?:\/reviews)?)?\/?$/i;
const GOODREADS_HOSTS = new Set(['goodreads.com', 'm.goodreads.com', 'www.goodreads.com']);

export type GoodreadsBookUrl = {
	bookId: string;
	canonicalUrl: string;
	slug?: string;
};

export function parseGoodreadsBookUrl(input: string): GoodreadsBookUrl | undefined {
	// Goodreads JSON-LD sometimes carries site-relative identities (`/book/show/…`).
	const absolute = input.startsWith('/') ? `https://www.goodreads.com${input}` : input;
	const parsed = tryParseUrl(absolute);
	const host = parsed?.hostname.toLowerCase();
	if (!parsed || !host || !GOODREADS_HOSTS.has(host)) {
		return undefined;
	}

	const match = GOODREADS_BOOK_PATH.exec(parsed.pathname);
	const bookId = match?.[1];
	if (!bookId) {
		return undefined;
	}

	return {
		bookId,
		canonicalUrl: `https://www.goodreads.com/book/show/${bookId}`,
		...(match[2] ? { slug: match[2] } : {}),
	};
}
