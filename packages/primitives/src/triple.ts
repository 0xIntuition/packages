import { calculateCounterTripleId, calculateTripleId } from '@0xintuition/ids';
import {
	getPredicateBehavior,
	getPredicateRecord,
	PREDICATE_IDS,
	PREDICATE_NAME_TO_KEY,
	type PredicateBehaviorTarget,
	type PredicateKey,
} from '@0xintuition/predicates';
import type { Hex } from 'viem';

import type {
	BuildResult,
	CounterTripleBlueprint,
	GuidedTripleBlueprint,
	TripleBlueprint,
	TripleIntent,
	TripleInterpretation,
} from './types.js';

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

/**
 * Explain a triple intent using predicate behavior metadata.
 *
 * This helper is intentionally interpretive, not restrictive. It reports warnings
 * when behavior metadata is missing or the supplied actor source does not match
 * the predicate's canonical behavior.
 */
export function explainTriple(
	intent: Omit<TripleIntent, 'subjectId' | 'objectId'> &
		Partial<Pick<TripleIntent, 'subjectId' | 'objectId'>>
) {
	const record = getPredicateRecord(intent.predicateKey as PredicateKey);

	if (!record) {
		return {
			success: false,
			errors: [`Unknown predicate key "${intent.predicateKey}".`],
		} satisfies BuildResult<TripleInterpretation>;
	}

	const behavior = getPredicateBehavior(record.key);
	const warnings: string[] = [];

	if (!behavior) {
		warnings.push(`Predicate "${record.key}" does not define behavior metadata yet.`);
	}

	if (
		behavior?.actor?.source &&
		intent.actorSource &&
		behavior.actor.source !== intent.actorSource
	) {
		warnings.push(
			`Actor source "${intent.actorSource}" does not match canonical source "${behavior.actor.source}".`
		);
	}

	const targetErrors = [
		...validateTarget({
			side: 'subject',
			target: behavior?.expectedSubject,
			atomId: intent.subjectId,
			classification: intent.subjectClassification,
		}),
		...validateTarget({
			side: 'object',
			target: behavior?.expectedObject,
			atomId: intent.objectId,
			classification: intent.objectClassification,
			peerClassification: intent.subjectClassification,
		}),
	];

	if (targetErrors.length > 0) {
		return {
			success: false,
			errors: targetErrors,
		} satisfies BuildResult<TripleInterpretation>;
	}

	const subjectRole = behavior?.subjectRole ?? 'subject';
	const objectRole = behavior?.objectRole ?? 'object';
	const subjectLabel = intent.subjectLabel ?? subjectRole;
	const objectLabel = intent.objectLabel ?? objectRole;
	const forwardDisplay = behavior?.display?.forward ?? record.thirdPerson ?? record.name;
	const reverseDisplay = behavior?.display?.reverse;
	const actorSource = behavior?.actor?.source ?? intent.actorSource;
	const actorRole = behavior?.actor?.role;
	const actorPrefix =
		intent.actorLabel && actorSource && actorSource !== 'subject'
			? `${intent.actorLabel} via ${actorSource}: `
			: '';

	return {
		success: true,
		value: {
			predicateKey: record.key,
			subjectRole,
			objectRole,
			...(actorSource ? { actorSource } : {}),
			...(actorRole ? { actorRole } : {}),
			plainEnglish: `${actorPrefix}${subjectLabel} ${forwardDisplay} ${objectLabel}`,
			...(reverseDisplay
				? { reversePlainEnglish: `${objectLabel} ${reverseDisplay} ${subjectLabel}` }
				: {}),
			warnings,
		},
	} satisfies BuildResult<TripleInterpretation>;
}

/**
 * Build a deterministic triple and attach predicate behavior interpretation.
 */
export function guidedBuildTriple(intent: TripleIntent): BuildResult<GuidedTripleBlueprint> {
	const triple = buildTriple(intent.subjectId, intent.predicateKey, intent.objectId);

	if (!triple.success) {
		return triple;
	}

	const interpretation = explainTriple(intent);

	if (!interpretation.success) {
		return interpretation;
	}

	const behavior = getPredicateBehavior(triple.value.predicateKey);

	return {
		success: true,
		value: {
			...triple.value,
			...(behavior ? { behavior } : {}),
			interpretation: interpretation.value,
			warnings: interpretation.value.warnings,
		},
	};
}

function validateTarget({
	side,
	target,
	atomId,
	classification,
	peerClassification,
}: {
	side: 'subject' | 'object';
	target: PredicateBehaviorTarget | undefined;
	atomId?: Hex;
	classification: string | undefined;
	peerClassification?: string;
}) {
	if (!target || target.kind === 'any') {
		return [];
	}

	if (target.kind === 'atom') {
		if (!atomId) {
			return [];
		}

		if (atomId === target.id) {
			return [];
		}

		return [
			`Invalid ${side} placement: expected ${formatTarget(target)}, received ${atomId ?? 'unknown atom'}.`,
		];
	}

	if (!classification) {
		return [
			`Cannot validate ${side} placement because predicate behavior expects ${formatTarget(
				target
			)} but no ${side} classification was supplied.`,
		];
	}

	if (target.kind === 'classification' && !target.slugs.includes(classification)) {
		return [
			`Invalid ${side} placement: expected ${formatTarget(target)}, received classification:${classification}.`,
		];
	}

	if (target.kind === 'same-classification' && classification !== peerClassification) {
		return [
			`Invalid ${side} placement: expected same classification as subject, received classification:${classification}.`,
		];
	}

	return [];
}

function formatTarget(target: PredicateBehaviorTarget) {
	switch (target.kind) {
		case 'atom':
			return target.label ? `${target.label} (${target.id})` : `atom:${target.id}`;
		case 'classification':
			return target.slugs.map((slug) => `classification:${slug}`).join(' or ');
		case 'same-classification':
			return 'same classification as subject';
		case 'schema':
			return `schema:${target.type}`;
		case 'any':
			return target.reason ? `any (${target.reason})` : 'any';
		default:
			return target satisfies never;
	}
}
