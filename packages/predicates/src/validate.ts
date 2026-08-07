import type { PredicateSpec } from './types.js';

/**
 * Cross-referential consistency gate for the predicate set (see
 * `.planning/predicate-spec-decisions.md` §5.1). These rules need the whole set — key existence,
 * inverse mirroring, contradicts symmetry, specializes acyclicity, contradiction-vs-hierarchy
 * coherence. Per-spec rules (symmetry/inverse conflict, polarity∧transitive, literalType,
 * supersededBy status) are enforced in `definePredicateRecord`.
 *
 * `errors` are hard violations (should fail the build/tests). `warnings` are the lint-level rules
 * (near-universal but with conceivable exceptions) that are surfaced, not enforced.
 */
export interface PredicateSetValidation {
	errors: string[];
	warnings: string[];
	/** Contradiction set closed down the specializes hierarchy (rule 7): key → disjoint keys. */
	contradictionClosure: Record<string, string[]>;
}

export function validatePredicateSet(specs: readonly PredicateSpec[]): PredicateSetValidation {
	const errors: string[] = [];
	const warnings: string[] = [];
	const byKey = new Map<string, PredicateSpec>();

	for (const spec of specs) {
		if (byKey.has(spec.key)) {
			errors.push(`duplicate predicate key "${spec.key}".`);
		}
		byKey.set(spec.key, spec);
	}

	const known = (key: string) => byKey.has(key);
	const at = (spec: PredicateSpec) => `predicate "${spec.key}"`;

	for (const spec of specs) {
		// Referenced keys must exist.
		for (const ref of spec.specializes ?? []) {
			if (!known(ref)) errors.push(`${at(spec)}: specializes unknown predicate "${ref}".`);
		}
		for (const ref of spec.contradicts ?? []) {
			if (!known(ref)) errors.push(`${at(spec)}: contradicts unknown predicate "${ref}".`);
		}
		if (spec.inverse && !known(spec.inverse)) {
			errors.push(`${at(spec)}: inverse references unknown predicate "${spec.inverse}".`);
		}
		if (spec.supersededBy) {
			if (!known(spec.supersededBy)) {
				errors.push(
					`${at(spec)}: supersededBy references unknown predicate "${spec.supersededBy}".`
				);
			} else if (byKey.get(spec.supersededBy)?.status === 'deprecated') {
				errors.push(`${at(spec)}: supersededBy must point at a non-deprecated predicate.`);
			}
		}

		// Rule 2 — inverse mirroring + transitivity mirroring (rule 8, algebraic part = error).
		if (spec.inverse && known(spec.inverse)) {
			const other = byKey.get(spec.inverse) as PredicateSpec;
			if (other.inverse !== spec.key) {
				errors.push(
					`${at(spec)}: inverse "${spec.inverse}" must declare inverse "${spec.key}" back (got "${
						other.inverse ?? 'undefined'
					}").`
				);
			}
			if (Boolean(spec.isTransitive) !== Boolean(other.isTransitive)) {
				errors.push(
					`${at(spec)}: inverse pair must agree on isTransitive (theorem) — "${spec.key}"=${Boolean(
						spec.isTransitive
					)}, "${spec.inverse}"=${Boolean(other.isTransitive)}.`
				);
			}
			// Rule 8 (editorial part) — lint, not error.
			if ((spec.temporalNature ?? null) !== (other.temporalNature ?? null)) {
				warnings.push(
					`${at(spec)}: inverse pair temporalNature differs from "${spec.inverse}" (lint).`
				);
			}
			if ((spec.claimType ?? null) !== (other.claimType ?? null)) {
				warnings.push(`${at(spec)}: inverse pair claimType differs from "${spec.inverse}" (lint).`);
			}
			// Rule 13 — objectKind 'claim' with an inverse is a modeling smell (lint).
			if (spec.objectKind === 'claim') {
				warnings.push(
					`${at(spec)}: objectKind 'claim' with an inverse ("${spec.inverse}") — the inverse's subject would be a claim (lint).`
				);
			}
		}

		// Rule 3 — contradicts symmetry.
		for (const ref of spec.contradicts ?? []) {
			if (known(ref) && !(byKey.get(ref)?.contradicts ?? []).includes(spec.key)) {
				errors.push(
					`${at(spec)}: contradicts "${ref}" is not declared symmetrically ("${ref}" must contradict "${spec.key}").`
				);
			}
		}

		// Rule 9 — symmetric + transitive = equivalence relation; allowed only for the identity allow-list.
		const EQUIVALENCE_ALLOW_LIST = new Set(['sameAs']);
		if (spec.isSymmetric && spec.isTransitive && !EQUIVALENCE_ALLOW_LIST.has(spec.key)) {
			warnings.push(
				`${at(spec)}: isSymmetric+isTransitive behaves as an equivalence relation; identity behavior is opt-in by key (allow-list: sameAs) (lint).`
			);
		}
	}

	// Rule 5 — specializes acyclic. DFS over the specializes DAG.
	const visitState = new Map<string, 0 | 1 | 2>();
	const stack: string[] = [];
	const detectCycle = (key: string): void => {
		visitState.set(key, 1);
		stack.push(key);
		for (const parent of byKey.get(key)?.specializes ?? []) {
			if (!known(parent)) continue;
			const state = visitState.get(parent) ?? 0;
			if (state === 1) {
				errors.push(`specializes cycle: ${[...stack, parent].join(' ⊑ ')}.`);
			} else if (state === 0) {
				detectCycle(parent);
			}
		}
		stack.pop();
		visitState.set(key, 2);
	};
	for (const spec of specs) {
		if ((visitState.get(spec.key) ?? 0) === 0) detectCycle(spec.key);
	}

	// Ancestors under specializes (transitive closure of the parent relation), for rules 6 & 7.
	const ancestorsOf = (key: string): Set<string> => {
		const out = new Set<string>();
		const walk = (k: string) => {
			for (const parent of byKey.get(k)?.specializes ?? []) {
				if (known(parent) && !out.has(parent)) {
					out.add(parent);
					walk(parent);
				}
			}
		};
		walk(key);
		return out;
	};

	// Rule 6 — a predicate may not contradict its own specializes ancestor/descendant.
	for (const spec of specs) {
		const ancestors = ancestorsOf(spec.key);
		for (const ref of spec.contradicts ?? []) {
			if (ancestors.has(ref)) {
				errors.push(
					`${at(spec)}: contradicts "${ref}" which is a specializes-ancestor — asserting "${spec.key}" would entail and contradict it.`
				);
			}
		}
	}

	// Rule 7 — derive the contradiction closure down the hierarchy: P ⊑ Q ∧ Q ⊥ R ⟹ P ⊥ R.
	const contradictionClosure: Record<string, string[]> = {};
	for (const spec of specs) {
		const disjoint = new Set<string>(spec.contradicts ?? []);
		for (const ancestor of ancestorsOf(spec.key)) {
			for (const ref of byKey.get(ancestor)?.contradicts ?? []) {
				if (ref !== spec.key) disjoint.add(ref);
			}
		}
		if (disjoint.size > 0) contradictionClosure[spec.key] = [...disjoint].sort();
	}

	return { errors, warnings, contradictionClosure };
}
