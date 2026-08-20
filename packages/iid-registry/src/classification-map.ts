/**
 * The scheme => classification table: the read-side inverse of the identity
 * ladders, legal only for ratified-unambiguous schemes (spec §7.3) (a bare P0 anchor must
 * imply its classification).
 *
 * Typed total over `UnambiguousScheme` — when `@0xintuition/iid` ratifies a
 * new unambiguous scheme, this table (and its tests) must gain an entry
 * before the registry builds again. Slugs are validated against
 * `@0xintuition/classifications` at resolution time, never trusted as raw
 * strings.
 */
import { hasClassification } from '@0xintuition/classifications';
import type { ClassificationEntry, UnambiguousScheme } from './types.js';

/**
 * MBID uniqueness is per entity type; the type segment travels in the value.
 * `release` folds to the album work the same way OpenLibrary editions fold to
 * `book` (manifestation-level IDs bridge via equivalence, spec §5.5); `work` is
 * composition territory with no classification yet (same gap as `iswc`).
 */
const MBID_ENTITY_SLUGS: Readonly<Record<string, string | undefined>> = {
	artist: 'music-group',
	recording: 'music-recording',
	'release-group': 'music-album',
	release: 'music-album',
	label: 'company',
	work: undefined,
};

function resolveMbidSlug(canonicalValue: string): string | undefined {
	const separator = canonicalValue.indexOf(':');

	if (separator <= 0) {
		return undefined;
	}

	return MBID_ENTITY_SLUGS[canonicalValue.slice(0, separator)];
}

/** OpenLibrary IDs type via suffix: OL…A author, OL…W work, OL…M edition. */
function resolveOlidSlug(canonicalValue: string): string | undefined {
	switch (canonicalValue.at(-1)) {
		case 'A':
			return 'person';
		case 'W':
		case 'M':
			// Editions fold to the book work; edition-level identity bridges
			// via equivalence (see the book ladder's stance on ISBN).
			return 'book';
		default:
			return undefined;
	}
}

/**
 * CAIP-19 is ratified unambiguous, but only the `eip155`/`erc20` asset shape
 * has a classification today. Other namespaces (Solana SPL, `erc721`, …)
 * resolve to no classification — still valid, still enrichable — rather than
 * mislabeling every chain asset as an Ethereum ERC-20.
 */
function resolveCaip19Slug(canonicalValue: string): string | undefined {
	return /^eip155:[-_a-zA-Z0-9]{1,32}\/erc20:/.test(canonicalValue) ? 'ethereum-erc20' : undefined;
}

/** gen1 values are `<classification-slug>:r<N>:<hash>` — the slug is authoritative. */
function resolveGen1Slug(canonicalValue: string): string | undefined {
	const separator = canonicalValue.indexOf(':');

	if (separator <= 0) {
		return undefined;
	}

	const slug = canonicalValue.slice(0, separator);
	return hasClassification(slug) ? slug : undefined;
}

export const SCHEME_CLASSIFICATIONS: Readonly<Record<UnambiguousScheme, ClassificationEntry>> = {
	isbn: { kind: 'direct', slug: 'book' },
	isrc: { kind: 'direct', slug: 'music-recording' },
	iswc: {
		kind: 'unmapped',
		reason: 'identifies a musical composition; no music-composition classification exists yet',
	},
	lei: { kind: 'direct', slug: 'company' },
	gtin: { kind: 'direct', slug: 'product' },
	// EIDR spans film and TV, but it is film-centric in practice and TV
	// content reaches us via tmdb/imdb/wd.
	eidr: { kind: 'direct', slug: 'movie' },
	mbid: { kind: 'value-typed', resolveSlug: resolveMbidSlug },
	olid: { kind: 'value-typed', resolveSlug: resolveOlidSlug },
	podcastguid: { kind: 'direct', slug: 'podcast-series' },
	caip19: { kind: 'value-typed', resolveSlug: resolveCaip19Slug },
	appid: { kind: 'direct', slug: 'mobile-application' },
	purl: { kind: 'direct', slug: 'software' },
	acct: { kind: 'direct', slug: 'social-media-account' },
	rssitem: { kind: 'direct', slug: 'podcast-episode' },
	termset: { kind: 'direct', slug: 'defined-term' },
	gen1: { kind: 'value-typed', resolveSlug: resolveGen1Slug },
};
