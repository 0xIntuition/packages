import { describe, expect, it } from 'vitest';

import {
	assertValidHash,
	isValidAtomId,
	isValidCounterTripleId,
	isValidTripleId,
} from '../validate';

const VALID_HASH = '0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e';

describe('isValidAtomId', () => {
	it('returns true for a valid 66-character hex string', () => {
		expect(isValidAtomId(VALID_HASH)).toBe(true);
	});

	it('returns false for a short hex string', () => {
		expect(isValidAtomId('0x1234')).toBe(false);
	});

	it('returns false for a non-hex string', () => {
		expect(isValidAtomId('not-hex')).toBe(false);
	});

	it('returns false for an empty string', () => {
		expect(isValidAtomId('')).toBe(false);
	});

	it('returns false for a hex string with odd characters (65 chars)', () => {
		expect(isValidAtomId(`${VALID_HASH.slice(0, -1)}`)).toBe(false);
	});

	it('returns false for a hex string that is too long', () => {
		expect(isValidAtomId(`${VALID_HASH}ff`)).toBe(false);
	});
});

describe('isValidTripleId', () => {
	it('returns true for a valid 66-character hex string', () => {
		expect(isValidTripleId(VALID_HASH)).toBe(true);
	});

	it('returns false for invalid input', () => {
		expect(isValidTripleId('hello')).toBe(false);
		expect(isValidTripleId('0x')).toBe(false);
	});
});

describe('isValidCounterTripleId', () => {
	it('returns true for a valid 66-character hex string', () => {
		expect(isValidCounterTripleId(VALID_HASH)).toBe(true);
	});

	it('returns false for invalid input', () => {
		expect(isValidCounterTripleId('0xshort')).toBe(false);
	});
});

describe('assertValidHash', () => {
	it('returns the value for a valid hash', () => {
		expect(assertValidHash(VALID_HASH)).toBe(VALID_HASH);
	});

	it('returns the value with a custom label', () => {
		expect(assertValidHash(VALID_HASH, 'atom ID')).toBe(VALID_HASH);
	});

	it('throws for a non-hex string', () => {
		expect(() => assertValidHash('not-hex', 'atom ID')).toThrow(
			'Invalid atom ID: expected hex string starting with 0x'
		);
	});

	it('throws for a too-short hex string', () => {
		expect(() => assertValidHash('0x1234', 'triple ID')).toThrow(
			'Invalid triple ID: expected 66-character hex string, got 6 characters'
		);
	});

	it('throws for a too-long hex string', () => {
		expect(() => assertValidHash(`${VALID_HASH}ff`, 'hash')).toThrow(
			'expected 66-character hex string, got 68 characters'
		);
	});
});
