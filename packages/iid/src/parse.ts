import { getScheme, SCHEME_TYPING } from './schemes.js';
import type { IidInspection, IntuitionId, ParsedIid, SchemeName } from './types.js';

/**
 * The full grammar (spec §2.2): `int:` namespace, 1-32 char lowercase
 * scheme, and a 1-220 char value of visible ASCII only (%x21-7E — no
 * space, no control characters, no non-ASCII).
 */
const IID_SHAPE = /^int:([a-z0-9-]{1,32}):([\x21-\x7E]{1,220})$/;

/** Matches the shape without requiring a registered scheme. */
const IID_SHAPE_ANY_SCHEME = IID_SHAPE;

/**
 * Parse an IID into scheme + value. Splits on the FIRST TWO colons only —
 * everything after the second colon is an opaque, scheme-owned value
 * (CAIP and DOI values contain `:` and `/`).
 */
export function parseIntuitionId(input: string): ParsedIid | undefined {
	const match = IID_SHAPE.exec(input);

	if (!match) {
		return undefined;
	}

	const scheme = getScheme(match[1] ?? '');

	if (!scheme) {
		return undefined;
	}

	return { scheme: scheme.scheme, value: match[2] ?? '' };
}

/**
 * Full validation: well-formed, registered scheme, and the value is in the
 * scheme's canonical form (byte-exact — there is no case-insensitive
 * matching at the ID layer).
 */
export function validateIntuitionId(input: string): input is IntuitionId {
	const parsed = parseIntuitionId(input);

	if (!parsed) {
		return false;
	}

	const scheme = getScheme(parsed.scheme);

	if (!scheme) {
		return false;
	}

	return scheme.isCanonical(parsed.value);
}

/** Type guard for the broad IID string shape (does not check canonical form). */
export function isIntuitionId(input: string): input is IntuitionId {
	return parseIntuitionId(input) !== undefined;
}

/**
 * May this IID mint as a P0 anchor (atom data = the bare IID string)?
 * Requires: valid + canonical, Class A or B (Class C recipe fields are
 * preimage evidence and must travel in a P1 payload), and a scheme whose
 * IIDs imply their classification (spec §7.2).
 */
export function isAnchorEligible(input: string): boolean {
	const inspection = inspectIntuitionId(input);
	return inspection.valid && inspection.anchorEligible;
}

/**
 * Typed inspection: one call that distinguishes every failure mode a
 * caller can act on (spec §2.5 validity, §7.2 anchor eligibility).
 *
 * - `malformed` — not `int:<scheme>:<value>` per the grammar
 * - `unknown-scheme` — the registry is closed; unknown schemes are invalid
 * - `noncanonical` — a real scheme, but the value is not canonical form.
 *   When the value canonicalizes, the repaired IID is reported so read
 *   paths can resolve historical/foreign spellings WITHOUT treating them
 *   as valid new anchors.
 */
export function inspectIntuitionId(input: string): IidInspection {
	const match = IID_SHAPE_ANY_SCHEME.exec(input);

	if (!match) {
		return { valid: false, reason: 'malformed' };
	}

	const schemeName = match[1] ?? '';
	const value = match[2] ?? '';
	const scheme = getScheme(schemeName);

	if (!scheme) {
		return { valid: false, reason: 'unknown-scheme', scheme: schemeName, value };
	}

	if (!scheme.isCanonical(value)) {
		const canonical = scheme.canonicalize(value);
		return {
			valid: false,
			reason: 'noncanonical',
			scheme: scheme.scheme,
			value,
			...(canonical !== undefined
				? { canonical: formatIntuitionId(scheme.scheme, canonical) }
				: {}),
		};
	}

	const typing = SCHEME_TYPING[scheme.scheme];
	const anchorIneligibilityReason =
		scheme.class === 'C'
			? ('class-c' as const)
			: typing === 'polymorphic'
				? ('polymorphic-scheme' as const)
				: undefined;

	return {
		valid: true,
		iid: formatIntuitionId(scheme.scheme, value),
		scheme: scheme.scheme,
		value,
		class: scheme.class,
		typing,
		anchorEligible: anchorIneligibilityReason === undefined,
		...(anchorIneligibilityReason ? { anchorIneligibilityReason } : {}),
	};
}

/** Assemble an IID from a scheme and an ALREADY-CANONICAL value. */
export function formatIntuitionId(scheme: SchemeName, canonicalValue: string): IntuitionId {
	return `int:${scheme}:${canonicalValue}`;
}
