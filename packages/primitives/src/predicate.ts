import { calculateAtomId } from '@0xintuition/ids';
import {
	createPredicateAtomData,
	getPredicateRecord,
	PREDICATE_ATOM_DATA,
	PREDICATE_IDS,
	PREDICATE_RECORDS,
	type PredicateKey,
} from '@0xintuition/predicates';

import type { AtomBlueprint, BuildResult, PredicateInfo } from './types.js';

/**
 * Get full predicate info (ID, name, atom data, category, description) for a registry key.
 *
 * Returns `undefined` if the key is not found in the predicate registry.
 *
 * @example
 * ```ts
 * const info = getPredicateInfo('follow');
 * if (info) {
 *   console.log(info.id);       // deterministic atom ID
 *   console.log(info.name);     // "follow"
 *   console.log(info.category); // "Social/Reputation"
 * }
 * ```
 *
 * @param key - A predicate registry key (e.g. "follow", "hasTag", "betterThan").
 * @returns The predicate info object, or `undefined` if the key is unknown.
 */
export function getPredicateInfo(key: string): PredicateInfo | undefined {
	const record = getPredicateRecord(key as PredicateKey);

	if (!record) {
		return undefined;
	}

	const id = PREDICATE_IDS[key as PredicateKey];
	const atomData = PREDICATE_ATOM_DATA[key as PredicateKey];

	if (!id || !atomData) {
		return undefined;
	}

	return {
		key: record.key,
		id,
		name: record.name,
		atomData,
		category: record.category,
		description: record.description,
	};
}

/**
 * List predicates from the registry, optionally filtered by category.
 *
 * When called without arguments, returns all predicates. Pass a category string
 * to filter (e.g. "Social/Reputation", "Identity/Classification").
 *
 * @example
 * ```ts
 * // All predicates
 * const all = listPredicates();
 *
 * // Only social/reputation predicates
 * const social = listPredicates('Social/Reputation');
 * ```
 *
 * @param category - Optional category filter.
 * @returns An array of {@link PredicateInfo} objects.
 */
export function listPredicates(category?: string): PredicateInfo[] {
	const records = category
		? PREDICATE_RECORDS.filter((record) => record.category === category)
		: PREDICATE_RECORDS;

	const result: PredicateInfo[] = [];

	for (const record of records) {
		const id = PREDICATE_IDS[record.key as PredicateKey];
		const atomData = PREDICATE_ATOM_DATA[record.key as PredicateKey];

		if (!id || !atomData) {
			continue;
		}

		result.push({
			key: record.key,
			id,
			name: record.name,
			atomData,
			category: record.category,
			description: record.description,
		});
	}

	return result;
}

/**
 * Build a custom predicate atom blueprint from a name and description.
 *
 * This creates a new predicate that is not part of the canonical registry.
 * The resulting atom data follows the same JSON-LD DefinedTerm format used
 * by all registry predicates.
 *
 * Returns a {@link BuildResult} containing either an {@link AtomBlueprint} with
 * the serialized JSON-LD atom data and deterministic atom ID, or a list of
 * validation errors if the name or description is empty.
 *
 * @example
 * ```ts
 * const result = buildCustomPredicate('mentored by', 'Subject was mentored by the object entity');
 * if (result.success) {
 *   console.log(result.value.data);
 *   // '{"@context":"https://schema.org/","@type":"DefinedTerm","name":"mentored by","description":"Subject was mentored by the object entity"}'
 *   console.log(result.value.id); // deterministic atom ID
 * }
 * ```
 *
 * @param name - The predicate name (e.g. "mentored by").
 * @param description - A description of the predicate's meaning.
 * @returns A {@link BuildResult} with an {@link AtomBlueprint} (classification "predicate") or validation errors.
 */
export function buildCustomPredicate(
	name: string,
	description: string
): BuildResult<AtomBlueprint> {
	const errors: string[] = [];

	if (!name || name.trim().length === 0) {
		errors.push('Predicate name must be a non-empty string.');
	}

	if (!description || description.trim().length === 0) {
		errors.push('Predicate description must be a non-empty string.');
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	const data = createPredicateAtomData(name, description);
	const id = calculateAtomId(data);

	return {
		success: true,
		value: {
			classification: 'predicate',
			data,
			id,
			values: { name, description },
		},
	};
}
