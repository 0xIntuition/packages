import { calculateCounterTripleId, calculateTripleId } from '@0xintuition/ids';
import {
	getPredicateRecord,
	PREDICATE_IDS,
	PREDICATE_NAME_TO_KEY,
	type PredicateKey,
} from '@0xintuition/predicates';
import type { Hex } from 'viem';

import type { BuildResult, CounterTripleBlueprint, TripleBlueprint } from './types.js';

/**
 * Build a triple from atom IDs and a predicate key from the registry.
 *
 * Returns a {@link BuildResult} containing either a {@link TripleBlueprint} with
 * the deterministic triple ID, or a list of errors (e.g. unknown predicate key).
 *
 * @example
 * ```ts
 * const result = buildTriple(personAtom.id, 'follow', companyAtom.id);
 * if (result.success) {
 *   console.log(result.value.id);          // deterministic triple ID
 *   console.log(result.value.predicateId); // predicate atom ID
 * }
 * ```
 *
 * @param subjectId - The atom ID of the subject.
 * @param predicateKey - A predicate key from the predicate registry (e.g. "follow", "hasTag").
 * @param objectId - The atom ID of the object.
 * @returns A {@link BuildResult} with the triple blueprint or errors.
 */
export function buildTriple(
	subjectId: Hex,
	predicateKey: string,
	objectId: Hex
): BuildResult<TripleBlueprint> {
	const record = getPredicateRecord(predicateKey as PredicateKey);

	if (!record) {
		return {
			success: false,
			errors: [`Unknown predicate key "${predicateKey}".`],
		};
	}

	const predicateId = PREDICATE_IDS[predicateKey as PredicateKey];

	if (!predicateId) {
		return {
			success: false,
			errors: [`Could not resolve atom ID for predicate "${predicateKey}".`],
		};
	}

	const tripleId = calculateTripleId(subjectId, predicateId, objectId);

	return {
		success: true,
		value: {
			subjectId,
			predicateKey,
			predicateId,
			objectId,
			id: tripleId,
		},
	};
}

/**
 * Build a counter-triple for an existing triple.
 *
 * A counter-triple is the negation of a triple. Given a triple
 * "Alice follows Bob", the counter-triple represents "Alice does NOT follow Bob".
 * The counter-triple ID is deterministically derived from the original triple ID.
 *
 * @example
 * ```ts
 * const triple = buildTriple(aliceId, 'follow', bobId);
 * if (triple.success) {
 *   const counter = buildCounterTriple(triple.value);
 *   console.log(counter.id);       // deterministic counter-triple ID
 *   console.log(counter.tripleId); // original triple ID
 * }
 * ```
 *
 * @param triple - The original triple blueprint to negate.
 * @returns A {@link CounterTripleBlueprint} with the counter-triple ID.
 */
export function buildCounterTriple(triple: TripleBlueprint): CounterTripleBlueprint {
	return {
		tripleId: triple.id,
		id: calculateCounterTripleId(triple.id),
		subjectId: triple.subjectId,
		predicateKey: triple.predicateKey,
		predicateId: triple.predicateId,
		objectId: triple.objectId,
	};
}

/**
 * Build a triple using a predicate name (case-insensitive) instead of a registry key.
 *
 * This is a convenience wrapper around {@link buildTriple} for when you know
 * the predicate by its human-readable name rather than its camelCase key.
 *
 * @example
 * ```ts
 * const result = buildTripleByName(personAtom.id, 'has tag', tagAtom.id);
 * if (result.success) {
 *   console.log(result.value.predicateKey); // "hasTag"
 * }
 * ```
 *
 * @param subjectId - The atom ID of the subject.
 * @param predicateName - A predicate name (e.g. "follow", "has tag", "bullish on").
 * @param objectId - The atom ID of the object.
 * @returns A {@link BuildResult} with the triple blueprint or errors.
 */
export function buildTripleByName(
	subjectId: Hex,
	predicateName: string,
	objectId: Hex
): BuildResult<TripleBlueprint> {
	const key = PREDICATE_NAME_TO_KEY[predicateName.trim().toLowerCase()];

	if (!key) {
		return {
			success: false,
			errors: [`Unknown predicate name "${predicateName}".`],
		};
	}

	return buildTriple(subjectId, key, objectId);
}
