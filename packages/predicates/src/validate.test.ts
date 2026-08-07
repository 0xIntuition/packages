import { describe, expect, it } from 'vitest';
import { PREDICATE_SPECS } from './generated/index';
import { validatePredicateSet } from './validate';

describe('predicate set consistency gate', () => {
	const result = validatePredicateSet(PREDICATE_SPECS);

	it('has zero hard errors across the full registry', () => {
		expect(result.errors).toEqual([]);
	});

	it('declares inverse pairs symmetrically with mirrored transitivity', () => {
		const byKey = new Map(PREDICATE_SPECS.map((s) => [s.key, s]));
		for (const spec of PREDICATE_SPECS) {
			if (!spec.inverse) continue;
			const other = byKey.get(spec.inverse);
			expect(other, `${spec.key}.inverse -> ${spec.inverse}`).toBeDefined();
			expect(other?.inverse).toBe(spec.key);
			expect(Boolean(other?.isTransitive)).toBe(Boolean(spec.isTransitive));
		}
	});

	it('declares contradicts symmetrically and never on itself', () => {
		const byKey = new Map(PREDICATE_SPECS.map((s) => [s.key, s]));
		for (const spec of PREDICATE_SPECS) {
			for (const ref of spec.contradicts ?? []) {
				expect(ref).not.toBe(spec.key);
				expect(byKey.get(ref)?.contradicts ?? []).toContain(spec.key);
			}
		}
	});

	it('never marks a polarity-bearing predicate transitive (Guha 2004)', () => {
		for (const spec of PREDICATE_SPECS) {
			if (spec.polarity !== undefined) expect(spec.isTransitive ?? false).toBe(false);
		}
	});

	it('only attaches literalType to literal objects', () => {
		for (const spec of PREDICATE_SPECS) {
			if (spec.literalType !== undefined) expect(spec.objectKind).toBe('literal');
		}
	});

	it('closes contradictions down the specializes hierarchy (rule 7)', () => {
		// endorse ⊑ support, support ⊥ oppose ⟹ endorse ⊥ oppose (derived, not authored).
		expect(result.contradictionClosure.endorse).toContain('oppose');
		expect(result.contradictionClosure.vouchFor).toContain('oppose');
	});
});
