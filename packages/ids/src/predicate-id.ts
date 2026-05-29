import { calculateAtomId } from './atom-id';
import type { AtomId } from './types';

/**
 * The canonical JSON-LD context used in predicate atom data documents.
 */
export const PREDICATE_SCHEMA_CONTEXT = 'https://schema.org/' as const;

/**
 * The canonical JSON-LD type used for predicate atom data documents.
 */
export const PREDICATE_DEFINED_TERM_TYPE = 'DefinedTerm' as const;

/**
 * The JSON-LD document shape used to derive canonical predicate atom data.
 *
 * Matches the `PredicateAtomDocument` type from `@0xintuition/predicates`.
 */
export interface PredicateAtomDocument {
	'@context': typeof PREDICATE_SCHEMA_CONTEXT;
	'@type': typeof PREDICATE_DEFINED_TERM_TYPE;
	name: string;
	description: string;
}

/**
 * Build the canonical JSON string for a predicate's inline atom data.
 *
 * Predicates are stored as JSON-LD `DefinedTerm` documents with a fixed
 * key ordering: `@context`, `@type`, `name`, `description`.
 *
 * @param name - The predicate name (e.g. `"follow"`).
 * @param description - The predicate description (e.g. `"Directional subscription"`).
 * @returns A deterministic JSON string.
 *
 * @example
 * ```ts
 * createPredicateAtomData('follow', 'Directional subscription')
 * // '{"@context":"https://schema.org/","@type":"DefinedTerm","name":"follow","description":"Directional subscription"}'
 * ```
 */
export function createPredicateAtomData(name: string, description: string): string {
	return JSON.stringify({
		'@context': PREDICATE_SCHEMA_CONTEXT,
		'@type': PREDICATE_DEFINED_TERM_TYPE,
		name,
		description,
	});
}

/**
 * Compute a deterministic predicate ID from its name and description.
 *
 * This is a convenience function that builds the canonical predicate atom data
 * and then computes the atom ID. The result matches `PREDICATE_IDS` in
 * `@0xintuition/predicates`.
 *
 * @param name - The predicate name (e.g. `"follow"`).
 * @param description - The predicate description (e.g. `"Directional subscription"`).
 * @returns A branded {@link AtomId}.
 *
 * @example
 * ```ts
 * calculatePredicateId('follow', 'Directional subscription')
 * // 0xdb3dc8c92d6141c4e0c9b453b00fc1f237624ef8373b6ae9972d09557d8aaa8d
 * ```
 */
export function calculatePredicateId(name: string, description: string): AtomId {
	return calculateAtomId(createPredicateAtomData(name, description));
}
