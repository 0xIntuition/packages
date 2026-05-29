import { createPredicateAtomData, PREDICATE_IDS } from '@0xintuition/predicates';
import { describe, expect, it } from 'vitest';
import { buildCustomPredicate, calculateAtomId, getPredicateInfo, listPredicates } from '../index';

describe('getPredicateInfo', () => {
	it('returns full info for a known predicate key', () => {
		const info = getPredicateInfo('follow');

		expect(info).toBeDefined();
		expect(info?.key).toBe('follow');
		expect(info?.name).toBe('follow');
		expect(info?.id).toBe(PREDICATE_IDS.follow);
		expect(info?.category).toBe('Social/Reputation');
		expect(info?.description).toBeTruthy();
		expect(info?.atomData).toBeTruthy();
	});

	it('returns undefined for unknown predicate keys', () => {
		expect(getPredicateInfo('nonexistent')).toBeUndefined();
	});

	it('returns atom data that matches the canonical format', () => {
		const info = getPredicateInfo('follow');

		expect(info).toBeDefined();

		if (!info) {
			return;
		}

		const parsed = JSON.parse(info.atomData);

		expect(parsed).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'DefinedTerm',
			name: 'follow',
			description: expect.any(String),
		});
	});

	it('returns an ID that matches calculateAtomId of the atom data', () => {
		const info = getPredicateInfo('hasTag');

		expect(info).toBeDefined();

		if (!info) {
			return;
		}

		expect(info.id).toBe(calculateAtomId(info.atomData));
	});
});

describe('listPredicates', () => {
	it('lists all registered predicates when no category is specified', () => {
		const all = listPredicates();

		expect(all.length).toBeGreaterThan(0);
		expect(all).toContainEqual(
			expect.objectContaining({
				key: 'follow',
				id: PREDICATE_IDS.follow,
			})
		);
	});

	it('filters predicates by category', () => {
		const social = listPredicates('Social/Reputation');

		expect(social.length).toBeGreaterThan(0);
		expect(social.every((p) => p.category === 'Social/Reputation')).toBe(true);
		expect(social).toContainEqual(expect.objectContaining({ key: 'follow' }));
	});

	it('returns an empty array for unknown categories', () => {
		const result = listPredicates('Nonexistent Category');

		expect(result).toEqual([]);
	});

	it('each entry has a valid ID and atom data', () => {
		const all = listPredicates();

		for (const entry of all) {
			expect(entry.id).toMatch(/^0x[a-f0-9]{64}$/);
			expect(entry.atomData).toBeTruthy();
			expect(entry.id).toBe(calculateAtomId(entry.atomData));
		}
	});
});

describe('buildCustomPredicate', () => {
	it('builds a custom predicate with canonical JSON-LD format', () => {
		const result = buildCustomPredicate('mentored by', 'Subject was mentored by the object entity');

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('predicate');
		expect(result.value.values).toEqual({
			name: 'mentored by',
			description: 'Subject was mentored by the object entity',
		});

		const parsed = JSON.parse(result.value.data);

		expect(parsed).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'DefinedTerm',
			name: 'mentored by',
			description: 'Subject was mentored by the object entity',
		});
	});

	it('produces a deterministic ID matching calculateAtomId', () => {
		const result = buildCustomPredicate('test predicate', 'A test');

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.id).toBe(calculateAtomId(result.value.data));
	});

	it('produces the same atom data format as createPredicateAtomData', () => {
		const name = 'custom pred';
		const description = 'Custom description';

		const result = buildCustomPredicate(name, description);
		const canonical = createPredicateAtomData(name, description);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.data).toBe(canonical);
	});

	it('produces different IDs for different predicates', () => {
		const result1 = buildCustomPredicate('alpha', 'First predicate');
		const result2 = buildCustomPredicate('beta', 'Second predicate');

		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);

		if (!result1.success || !result2.success) {
			return;
		}

		expect(result1.value.id).not.toBe(result2.value.id);
	});

	it('returns errors for empty name', () => {
		const result = buildCustomPredicate('', 'A description');

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Predicate name must be a non-empty string.');
	});

	it('returns errors for empty description', () => {
		const result = buildCustomPredicate('test', '');

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Predicate description must be a non-empty string.');
	});

	it('returns errors for whitespace-only name and description', () => {
		const result = buildCustomPredicate('   ', '   ');

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toHaveLength(2);
	});
});
