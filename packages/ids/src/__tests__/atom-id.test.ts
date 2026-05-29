import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { calculateAtomId } from '../atom-id';
import { isValidAtomId } from '../validate';

describe('calculateAtomId', () => {
	it('produces a deterministic ID for a plain string', () => {
		const id = calculateAtomId('hello');
		expect(id).toBe('0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e');
	});

	it('produces a deterministic ID for hex input', () => {
		const id = calculateAtomId('0xdeadbeef' as Hex);
		expect(id).toBe('0x444dc47f4010ae803416db4686d7b543a905ff9818e1236ed43b41f314fa42d2');
	});

	it('is idempotent — same input always yields same output', () => {
		const a = calculateAtomId('hello');
		const b = calculateAtomId('hello');
		expect(a).toBe(b);
	});

	it('produces different IDs for different inputs', () => {
		const a = calculateAtomId('Alice');
		const b = calculateAtomId('Bob');
		expect(a).not.toBe(b);
	});

	it('matches known test vectors for Alice and Bob', () => {
		expect(calculateAtomId('Alice')).toBe(
			'0x05bb6d28ed5ca3c5206f33f5818da27b3b0bbf6401cd40f082e8db7fcf481787'
		);
		expect(calculateAtomId('Bob')).toBe(
			'0x39afce29ac0e4be2400fa0421b537f63ad2d78d7f8b4be4ff839a162ff3e5ffc'
		);
	});

	it('returns a valid 32-byte hex string', () => {
		const id = calculateAtomId('hello');
		expect(isValidAtomId(id)).toBe(true);
	});

	it('handles empty string input', () => {
		const id = calculateAtomId('');
		expect(id).toBe('0xa8da6248914377c28bdf2ae6b993b7e9d33f247081ebf6d3acbe0c936f58ad7d');
		expect(isValidAtomId(id)).toBe(true);
	});

	it('handles the canonical "I" subject atom', () => {
		// The "I" atom is used for first-person references in the predicate system
		expect(calculateAtomId('I')).toBe(
			'0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b'
		);
	});

	it('handles unicode characters', () => {
		expect(calculateAtomId('caf\u00e9')).toBe(
			'0xdfdc0087cba61f7500cf7106b1406a09e1e37399967765ccc4c2b8a18944924f'
		);
	});

	it('handles emoji characters', () => {
		expect(calculateAtomId('\ud83d\ude80')).toBe(
			'0x4f891e7fc0fe6da24cd5352acaa2a732456e8d502bdad0ee3392d4fe03bbe569'
		);
	});

	it('treats equivalent hex and string encodings identically', () => {
		// "hello" -> toHex -> 0x68656c6c6f, same as passing the hex directly
		const fromString = calculateAtomId('hello');
		const fromHex = calculateAtomId('0x68656c6c6f' as Hex);
		expect(fromString).toBe(fromHex);
	});
});
