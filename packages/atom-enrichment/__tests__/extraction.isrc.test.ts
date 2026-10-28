import { describe, expect, it } from 'bun:test';
import { isValidIsrc, normalizeIsrc } from '../src/extraction/isrc';

// USUM71703861 — well-formed ISRC (US / UM7 / 17 / 03861).
const VALID = 'USUM71703861';

describe('isValidIsrc', () => {
	it('accepts a well-formed ISRC', () => {
		expect(isValidIsrc(VALID)).toBe(true);
	});

	it('is case-insensitive and tolerates surrounding whitespace', () => {
		expect(isValidIsrc('usum71703861')).toBe(true);
		expect(isValidIsrc('  USUM71703861  ')).toBe(true);
	});

	it('rejects malformed, empty, and nullish values', () => {
		expect(isValidIsrc('not-an-isrc')).toBe(false);
		expect(isValidIsrc('USUM7170386')).toBe(false); // one digit short
		expect(isValidIsrc('')).toBe(false);
		expect(isValidIsrc(undefined)).toBe(false);
		expect(isValidIsrc(null)).toBe(false);
	});
});

describe('normalizeIsrc', () => {
	it('trims and uppercases a valid ISRC', () => {
		expect(normalizeIsrc('  usum71703861 ')).toBe(VALID);
		expect(normalizeIsrc(VALID)).toBe(VALID);
	});

	it('returns undefined for malformed, empty, and nullish values', () => {
		expect(normalizeIsrc('not-an-isrc')).toBeUndefined();
		expect(normalizeIsrc('')).toBeUndefined();
		expect(normalizeIsrc(undefined)).toBeUndefined();
		expect(normalizeIsrc(null)).toBeUndefined();
	});
});
