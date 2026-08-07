/**
 * Scheme registry metadata for the identity ladders (IID spec §3, D30).
 *
 * The ladders themselves live on each generated `ClassificationSpec` as
 * declarative data. This module carries the per-scheme facts consumers and
 * tests need without a derivation engine: the identity class of every
 * scheme, and whether a bare IID of that scheme names its classification
 * (anchor eligibility, D30).
 *
 * Source of truth: intuition-v2 `.planning/intuition-id/scheme-registry.md`
 * and `@0xintuition/iid` `SCHEMES` / `SCHEME_TYPING`.
 */
import type {
	ClassificationSpec,
	IdentityClass,
	IdentityRung,
	IdentitySchemeName,
} from './types.js';

/** IID spec §3 — Class A registered authority, B intrinsic key, C derived. */
export const IDENTITY_SCHEME_CLASS: Readonly<Record<IdentitySchemeName, IdentityClass>> = {
	isbn: 'A',
	isrc: 'A',
	iswc: 'A',
	isni: 'A',
	orcid: 'A',
	lei: 'A',
	gtin: 'A',
	doi: 'A',
	eidr: 'A',
	wd: 'A',
	mbid: 'A',
	olid: 'A',
	imdb: 'A',
	tmdb: 'A',
	podcastguid: 'A',
	url: 'B',
	caip10: 'B',
	caip19: 'B',
	hash: 'B',
	appid: 'B',
	purl: 'B',
	geo: 'B',
	acct: 'B',
	rssitem: 'B',
	termset: 'B',
	gen1: 'C',
};

/**
 * D30 scheme typing: a P0 anchor (atom data = the bare IID string) is only
 * legal when the scheme implies the entity's classification. Polymorphic
 * schemes floor at P1, where `@type` lives in the payload.
 */
export const IDENTITY_SCHEME_TYPING: Readonly<
	Record<IdentitySchemeName, 'unambiguous' | 'polymorphic'>
> = {
	isbn: 'unambiguous',
	isrc: 'unambiguous',
	iswc: 'unambiguous',
	isni: 'polymorphic', // persons AND bands/orgs
	orcid: 'polymorphic', // kept symmetric with isni
	lei: 'unambiguous',
	gtin: 'unambiguous',
	doi: 'polymorphic', // articles, datasets, film
	eidr: 'unambiguous',
	wd: 'polymorphic',
	mbid: 'unambiguous', // type segment in-value
	olid: 'unambiguous', // W/M/A suffix in-value
	imdb: 'polymorphic',
	tmdb: 'polymorphic',
	podcastguid: 'unambiguous',
	url: 'polymorphic',
	caip10: 'polymorphic', // account OR contract
	caip19: 'unambiguous',
	hash: 'polymorphic',
	appid: 'unambiguous',
	purl: 'unambiguous',
	geo: 'polymorphic',
	acct: 'unambiguous',
	rssitem: 'unambiguous',
	termset: 'unambiguous',
	gen1: 'unambiguous', // slug in-value (still never P0 — Class C floors at P1)
};

/** The identity class a rung asserts (gen1 rungs are Class C by definition). */
export function rungClass(rung: IdentityRung): IdentityClass {
	return rung.kind === 'gen1' ? 'C' : IDENTITY_SCHEME_CLASS[rung.scheme];
}

/**
 * D29/D30: may this classification's STRONGEST rung mint as a P0 anchor?
 * True only when that rung is Class A/B on an unambiguous scheme. Class C
 * recipe fields are preimage evidence and must travel in a P1 payload.
 */
export function topRungAnchorEligible(spec: ClassificationSpec): boolean {
	const top = spec.identity?.ladder[0];

	if (!top || top.kind === 'gen1') {
		return false;
	}

	return IDENTITY_SCHEME_TYPING[top.scheme] === 'unambiguous';
}
