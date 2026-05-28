import { calculateAtomId, calculateTripleId } from '@0xintuition/ids';
import { renderHook } from '@testing-library/react';
import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { useAtomId, useTripleId } from '../hooks/use-identity';

describe('useAtomId', () => {
	it('returns undefined for undefined input', () => {
		const { result } = renderHook(() => useAtomId(undefined));
		expect(result.current).toBeUndefined();
	});

	it('returns undefined for empty string input', () => {
		const { result } = renderHook(() => useAtomId(''));
		expect(result.current).toBeUndefined();
	});

	it('computes the same ID as the SDK calculateAtomId for a plain string', () => {
		const atomData = 'hello-world';
		const expected = calculateAtomId(atomData);

		const { result } = renderHook(() => useAtomId(atomData));
		expect(result.current).toBe(expected);
	});

	it('computes the same ID as the SDK calculateAtomId for hex input', () => {
		const atomData = toHex('hello');
		const expected = calculateAtomId(atomData);

		const { result } = renderHook(() => useAtomId(atomData));
		expect(result.current).toBe(expected);
	});

	it('returns a deterministic result for the same input', () => {
		const atomData = 'deterministic-test';
		const { result: result1 } = renderHook(() => useAtomId(atomData));
		const { result: result2 } = renderHook(() => useAtomId(atomData));

		expect(result1.current).toBe(result2.current);
	});

	it('returns different IDs for different inputs', () => {
		const { result: result1 } = renderHook(() => useAtomId('atom-a'));
		const { result: result2 } = renderHook(() => useAtomId('atom-b'));

		expect(result1.current).not.toBe(result2.current);
	});
});

describe('useTripleId', () => {
	const subjectId = calculateAtomId('Alice');
	const predicateId = calculateAtomId('follows');
	const objectId = calculateAtomId('Bob');

	it('returns undefined when any input is undefined', () => {
		const { result: r1 } = renderHook(() => useTripleId(undefined, predicateId, objectId));
		expect(r1.current).toBeUndefined();

		const { result: r2 } = renderHook(() => useTripleId(subjectId, undefined, objectId));
		expect(r2.current).toBeUndefined();

		const { result: r3 } = renderHook(() => useTripleId(subjectId, predicateId, undefined));
		expect(r3.current).toBeUndefined();
	});

	it('computes the same ID as the SDK calculateTripleId', () => {
		const expected = calculateTripleId(subjectId, predicateId, objectId);

		const { result } = renderHook(() => useTripleId(subjectId, predicateId, objectId));
		expect(result.current).toBe(expected);
	});

	it('returns a deterministic result for the same inputs', () => {
		const { result: r1 } = renderHook(() => useTripleId(subjectId, predicateId, objectId));
		const { result: r2 } = renderHook(() => useTripleId(subjectId, predicateId, objectId));

		expect(r1.current).toBe(r2.current);
	});

	it('returns different IDs for different predicates', () => {
		const altPredicateId = calculateAtomId('blocks');

		const { result: r1 } = renderHook(() => useTripleId(subjectId, predicateId, objectId));
		const { result: r2 } = renderHook(() => useTripleId(subjectId, altPredicateId, objectId));

		expect(r1.current).not.toBe(r2.current);
	});
});
