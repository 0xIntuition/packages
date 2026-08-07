import type { PredicateRecord, PredicateSpec } from './types.js';

/**
 * Per-spec consistency gate. Checks the rules that need only a single spec (see
 * `.planning/predicate-spec-decisions.md` §5.1). Cross-referential rules that need the whole set
 * (inverse mirroring, contradicts symmetry, specializes acyclicity, key existence) live in
 * `validate.ts` and run over `PREDICATE_SPECS`.
 */
function assertSpecConsistency(spec: PredicateSpec): void {
	const where = `predicate "${spec.key}"`;

	// Rule 1 — isSymmetric ⟹ no distinct `inverse` (a symmetric predicate is its own inverse).
	if (spec.isSymmetric && spec.inverse && spec.inverse !== spec.key) {
		throw new Error(
			`${where}: isSymmetric predicates are their own inverse; remove inverse: "${spec.inverse}".`
		);
	}

	// Rule 4 — contradicts is irreflexive.
	if (spec.contradicts?.includes(spec.key)) {
		throw new Error(`${where}: contradicts must not include the predicate itself.`);
	}

	// Rule 10 — sentiment is never transitive (Guha 2004). polarity ∧ isTransitive is incoherent.
	if (spec.polarity !== undefined && spec.isTransitive) {
		throw new Error(
			`${where}: a predicate with polarity ("${spec.polarity}") cannot be isTransitive — sentiment does not propagate transitively.`
		);
	}

	// Rule 12 — literalType only means anything for a literal object.
	if (spec.literalType !== undefined && spec.objectKind !== 'literal') {
		throw new Error(
			`${where}: literalType ("${spec.literalType}") requires objectKind: 'literal' (got ${
				spec.objectKind ?? 'undefined'
			}).`
		);
	}

	// Rule 14 (partial) — supersededBy only makes sense on a deprecated predicate.
	if (spec.supersededBy !== undefined && spec.status !== 'deprecated') {
		throw new Error(
			`${where}: supersededBy is only valid when status === 'deprecated' (got '${spec.status}').`
		);
	}
}

export function definePredicateRecord<const TSpec extends PredicateSpec>(
	spec: TSpec
): PredicateRecord<TSpec> {
	assertSpecConsistency(spec);

	return {
		key: spec.key,
		name: spec.name,
		description: spec.description,
		marketPattern: spec.marketPattern,
		conjugates: spec.conjugates,
		category: spec.category,
		status: spec.status,
		isTransitive: spec.isTransitive ?? false,
		isSymmetric: spec.isSymmetric ?? false,
		isHierarchical: spec.isHierarchical ?? false,
		...(spec.thirdPerson ? { thirdPerson: spec.thirdPerson } : {}),
		...(spec.examples ? { examples: spec.examples } : {}),
		...(spec.inversePredicate ? { inversePredicate: spec.inversePredicate } : {}),
		...(spec.objectKind ? { objectKind: spec.objectKind } : {}),
		...(spec.literalType ? { literalType: spec.literalType } : {}),
		...(spec.polarity ? { polarity: spec.polarity } : {}),
		...(spec.temporalNature ? { temporalNature: spec.temporalNature } : {}),
		...(spec.claimType ? { claimType: spec.claimType } : {}),
		...(spec.inverse ? { inverse: spec.inverse } : {}),
		...(spec.specializes ? { specializes: spec.specializes } : {}),
		...(spec.contradicts ? { contradicts: spec.contradicts } : {}),
		...(spec.supersededBy ? { supersededBy: spec.supersededBy } : {}),
	};
}
