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
