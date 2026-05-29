import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { calculateAtomId } from '../atom-id';
import { calculatePredicateId } from '../predicate-id';
import { calculateCounterTripleId, calculateTripleId } from '../triple-id';
import { isValidCounterTripleId, isValidTripleId } from '../validate';

describe('calculateTripleId', () => {
	const aliceId = calculateAtomId('Alice');
	const bobId = calculateAtomId('Bob');
	const followId = calculatePredicateId('follow', 'Directional subscription');

	it('produces a deterministic triple ID from known components', () => {
		const tripleId = calculateTripleId(aliceId, followId, bobId);
		expect(tripleId).toBe('0x57946a02776dbd4eec339ecf5cdf6e0005b8de381fb3d9a2bf303da083bf5166');
	});

	it('is idempotent', () => {
		const a = calculateTripleId(aliceId, followId, bobId);
		const b = calculateTripleId(aliceId, followId, bobId);
		expect(a).toBe(b);
	});

	it('produces different IDs when components differ', () => {
		const forward = calculateTripleId(aliceId, followId, bobId);
		const reverse = calculateTripleId(bobId, followId, aliceId);
		expect(forward).not.toBe(reverse);
	});

	it('returns a valid 32-byte hex string', () => {
		const id = calculateTripleId(aliceId, followId, bobId);
		expect(isValidTripleId(id)).toBe(true);
	});
});

describe('calculateCounterTripleId', () => {
	const tripleId = '0x57946a02776dbd4eec339ecf5cdf6e0005b8de381fb3d9a2bf303da083bf5166' as Hex;

	it('produces a deterministic counter-triple ID', () => {
		const counterTripleId = calculateCounterTripleId(tripleId);
		expect(counterTripleId).toBe(
			'0x37030799932a0f63d305920571227642a8da3258475a032071109e4031254d23'
		);
	});

	it('is idempotent', () => {
		const a = calculateCounterTripleId(tripleId);
		const b = calculateCounterTripleId(tripleId);
		expect(a).toBe(b);
	});

	it('produces a different ID from the original triple ID', () => {
		const counterTripleId = calculateCounterTripleId(tripleId);
		expect(counterTripleId).not.toBe(tripleId);
	});

	it('returns a valid 32-byte hex string', () => {
		const id = calculateCounterTripleId(tripleId);
		expect(isValidCounterTripleId(id)).toBe(true);
	});
});
