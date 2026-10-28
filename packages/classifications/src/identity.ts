/**
 * Scheme registry metadata for the identity ladders (IID spec §3, §7.3).
 *
 * The ladders themselves live on each generated `ClassificationSpec` as
 * declarative data. The per-scheme facts — identity class and scheme
 * typing — are OWNED by `@0xintuition/iid` and surfaced here under the
 * names existing consumers already use.
 *
 * Normative source: `@0xintuition/iid-spec` (schemes/ registry).
 */
import { SCHEME_TYPING, SCHEMES } from '@0xintuition/iid';
import type {
	ClassificationSpec,
	IdentityClass,
	IdentityRung,
	IdentitySchemeName,
} from './types.js';

/** IID spec §3 — Class A registered authority, B intrinsic key, C derived. */
export const IDENTITY_SCHEME_CLASS: Readonly<Record<IdentitySchemeName, IdentityClass>> =
	Object.freeze(
		Object.fromEntries(
			Object.values(SCHEMES).map((definition) => [definition.scheme, definition.class])
		) as Record<IdentitySchemeName, IdentityClass>
	);

/**
 * Scheme typing (IID spec §7.3): a P0 anchor (atom data = the bare IID
 * string) is only legal when the scheme implies the entity's
 * classification. Polymorphic schemes floor at P1, where `@type` lives in
 * the payload.
 */
export const IDENTITY_SCHEME_TYPING: Readonly<
	Record<IdentitySchemeName, 'unambiguous' | 'polymorphic'>
> = SCHEME_TYPING;

/** The identity class a rung asserts (gen1 rungs are Class C by definition). */
export function rungClass(rung: IdentityRung): IdentityClass {
	return rung.kind === 'gen1' ? 'C' : IDENTITY_SCHEME_CLASS[rung.scheme];
}

/**
 * May this classification's STRONGEST rung mint as a P0 anchor (spec §7.2)?
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
