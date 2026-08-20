export type FieldType =
	| 'string'
	| 'url'
	| 'number'
	| 'integer'
	| 'address'
	| 'string[]'
	| 'iso-date'
	| 'iso-datetime';

export interface ClassificationFieldSpec {
	key: string;
	label: string;
	description: string;
	fieldType: FieldType;
	required: boolean;
	placeholder?: string;
	schemaProperty?: string;
}

export type PredicateKeyReference = string;

export type ClassificationCategory =
	| 'Entity'
	| 'Creative Work'
	| 'Media'
	| 'Product'
	| 'Web'
	| 'Blockchain'
	| 'Other';

// --- Identity (Intuition ID spec) -----------------------------------------
//
// Each classification declares an ordered identity ladder (IID spec §5):
// strongest identification first. Minting derives the `identifier` from the
// highest rung whose data is available. Ladders are DECLARATIVE data — the
// `@0xintuition/iid` derivation engine interprets the sources; nothing here
// executes.
//
// The ladder types are OWNED by `@0xintuition/iid` and re-exported here for
// compatibility. Normative rules live in `@0xintuition/iid-spec`:
// - §5.6: gen1 recipes never hash free-text names of RELATED entities
//   (author, byArtist, brand, employer) — relationships are triples.
// - §6.4: gen1 rung tags are stable recipe identifiers, frozen forever.
//   Inserting a rung assigns a fresh tag; tags never renumber.
// - §5.2: rungs are all-or-nothing — a rung fires only when every input it
//   names is present and canonicalizes.

export type {
	IdentityClass,
	IdentityDerivationName,
	IdentityRecipeField,
	IdentityRung,
	IdentityValueSource,
} from '@0xintuition/iid';

import type { IdentityRung, SchemeName } from '@0xintuition/iid';

/**
 * Compatibility alias: the governed scheme registry is owned by
 * `@0xintuition/iid` (`SchemeName`); classifications keeps this name for
 * existing consumers.
 */
export type IdentitySchemeName = SchemeName;

export interface IdentitySpec {
	/** The ontological level this classification identifies (one atom per level). */
	readonly identifies: string;
	/** Ordered strongest-first: Class A ≥ B ≥ C. */
	readonly ladder: readonly IdentityRung[];
}

export interface ClassificationSpec {
	slug: string;
	type: string;
	displayName: string;
	description: string;
	category: ClassificationCategory;
	schema: {
		context: string;
		type: string;
	} | null;
	fields: readonly ClassificationFieldSpec[];
	metadataPredicates: readonly PredicateKeyReference[];
	defaults: {
		pluginId: string;
		provider?: string;
	};
	/**
	 * The formalized identity spec, or null when the classification is
	 * deliberately outside IID scope (e.g. aggregate-rating, remodeled as a
	 * triple — D23).
	 */
	identity: IdentitySpec | null;
}

export type ClassificationValueMap = Record<string, unknown>;

export interface ClassificationValidationIssue {
	field?: string;
	message: string;
}
