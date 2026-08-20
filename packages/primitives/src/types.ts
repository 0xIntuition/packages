import type { Hex } from 'viem';

/**
 * A fully resolved atom blueprint containing the classification type,
 * serialized JSON-LD data, deterministic atom ID, and the original values.
 */
export interface AtomBlueprint {
	/** The classification slug used to build this atom (e.g. "person", "software"). */
	classification: string;
	/** The serialized JSON-LD atom data string. */
	data: string;
	/** The deterministic atom ID derived from the atom data. */
	id: Hex;
	/** The original field values used to construct the atom. */
	values: Record<string, unknown>;
}

/**
 * A fully resolved triple blueprint containing subject, predicate, and object
 * atom IDs plus the deterministic triple ID.
 */
export interface TripleBlueprint {
	/** The atom ID of the subject. */
	subjectId: Hex;
	/** The predicate key from the predicate registry. */
	predicateKey: string;
	/** The atom ID of the predicate. */
	predicateId: Hex;
	/** The atom ID of the object. */
	objectId: Hex;
	/** The deterministic triple ID derived from subject, predicate, and object IDs. */
	id: Hex;
}

/**
 * A counter-triple blueprint derived from an existing triple.
 * Represents the negation of a triple assertion.
 */
export interface CounterTripleBlueprint {
	/** The original triple ID this counter-triple negates. */
	tripleId: Hex;
	/** The deterministic counter-triple ID. */
	id: Hex;
	/** The atom ID of the subject (same as the original triple). */
	subjectId: Hex;
	/** The predicate key from the predicate registry (same as the original triple). */
	predicateKey: string;
	/** The atom ID of the predicate (same as the original triple). */
	predicateId: Hex;
	/** The atom ID of the object (same as the original triple). */
	objectId: Hex;
}

/**
 * Representation profile of an IID atom (IID spec §7): `p0` bare anchor,
 * `p1` identity context, `p2` enriched.
 */
export type AnchorProfile = 'p0' | 'p1' | 'p2';

/** Caller-supplied URI manifest limits (mirror `getAtomUriConfig` live values). */
export interface UriLimits {
	readonly maxUris: number;
	readonly maxUriBytes: number;
}

/** Options for the IID anchor builder. */
export interface IidAnchorOptions {
	/**
	 * Requested profile. Default: the strongest legal one (`p0` when the
	 * derived identifier is anchor-eligible, otherwise `p1`). Requesting
	 * `p0` for an ineligible identifier is a structured error.
	 */
	readonly profile?: AnchorProfile;
	/** Ordered URI context manifest (deduplicated, order-preserving). */
	readonly contextUris?: readonly string[];
	/** Live protocol limits; defaults to the offline policy floor. */
	readonly uriLimits?: UriLimits;
}

/**
 * A canonical IID atom anchor: on-chain-ready atom bytes derived from a
 * classification's identity ladder, plus read-side hints.
 *
 * URI context never changes `data`, `dataHex`, or `id`.
 */
export interface AtomAnchor {
	/** Classification slug resolved for the identifier. */
	classification: string;
	/** Representation profile the data was serialized at. */
	profile: AnchorProfile;
	/** The derived canonical Intuition ID. */
	iid: string;
	/** IID scheme that fired. */
	scheme: string;
	/** Identity class of that scheme (A/B/C). */
	class: 'A' | 'B' | 'C';
	/** Stable gen1 rung tag when a derived rung fired. */
	tag?: number;
	/** Exact atom data string (bare IID at p0; deterministic JSON at p1/p2). */
	data: string;
	/** UTF-8 bytes of `data` as hex. */
	dataHex: Hex;
	/** Deterministic atom ID over `data`. */
	id: Hex;
	/** Normalized, ordered, deduplicated URI context manifest. */
	contextUris: readonly string[];
	/** Ordered enrichment provider capability plan for the identifier. */
	providerPlan: readonly string[];
	/** The original field values used to derive the identifier. */
	values: Readonly<Record<string, unknown>>;
}

/**
 * A result type that represents either a successful value or a list of errors.
 * Used throughout the builder API to avoid throwing on bad input.
 */
export type BuildResult<T> = { success: true; value: T } | { success: false; errors: string[] };

/**
 * Summary information about a classification type for discovery purposes.
 */
export interface ClassificationSummary {
	/** The unique slug identifier for the classification. */
	slug: string;
	/** The schema.org type name (e.g. "Person", "Organization"). */
	type: string;
	/** A human-readable display name. */
	displayName: string;
	/** A short description of what this classification represents. */
	description: string;
	/** The broad category (Entity, Creative Work, Media, etc.). */
	category: string;
}

/**
 * Information about a single field within a classification spec.
 */
export interface FieldInfo {
	/** The field key used in the values object. */
	key: string;
	/** A human-readable label for the field. */
	label: string;
	/** A description of the field's purpose. */
	description: string;
	/** The expected data type for the field. */
	fieldType: string;
	/** Whether the field is required. */
	required: boolean;
	/** An example placeholder value. */
	placeholder?: string;
}

/**
 * Summary information about a predicate for discovery purposes.
 */
export interface PredicateInfo {
	/** The predicate registry key. */
	key: string;
	/** The predicate atom ID. */
	id: Hex;
	/** The human-readable predicate name. */
	name: string;
	/** The serialized JSON-LD atom data for the predicate. */
	atomData: string;
	/** The predicate category. */
	category: string;
	/** A description of the predicate's meaning. */
	description: string;
}

/**
 * The result of validating values against a classification spec.
 */
export interface ValidationResult {
	/** Whether the values are valid for the classification. */
	valid: boolean;
	/** A list of validation issue messages, empty when valid. */
	issues: string[];
}
