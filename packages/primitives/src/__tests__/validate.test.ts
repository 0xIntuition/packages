import { describe, expect, it } from 'vitest';

import { isValidAtomData, validateAtom } from '../index';

describe('validateAtom', () => {
	it('returns valid for correct person values', () => {
		const result = validateAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		expect(result.valid).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it('returns issues for missing required fields', () => {
		const result = validateAtom('person', { givenName: 'Vitalik' });

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Missing required field "familyName".');
	});

	it('returns issues for unknown fields', () => {
		const result = validateAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
			extra: 'bad',
		});

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Unknown field "extra" for classification "person".');
	});

	it('returns issues for invalid URL fields', () => {
		const result = validateAtom('web-page', {
			name: 'Test Page',
			url: 'not-a-url',
		});

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Field "url" must be a valid URL string.');
	});

	it('returns issues for empty string fields', () => {
		const result = validateAtom('person', {
			givenName: '',
			familyName: 'Buterin',
		});

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Field "givenName" must be a non-empty string.');
	});

	it('returns issues for invalid Ethereum address fields', () => {
		const result = validateAtom('ethereum-account', {
			address: '0x1234',
		});

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Field "address" must be a valid Ethereum address.');
	});

	it('returns valid for correct Ethereum address', () => {
		const result = validateAtom('ethereum-account', {
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		});

		expect(result.valid).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it('handles unknown classification gracefully', () => {
		const result = validateAtom('nonexistent', { name: 'test' });

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Unknown classification "nonexistent".');
	});

	it('validates optional fields when present', () => {
		const result = validateAtom('company', {
			name: 'Intuition Labs',
			url: 'definitely not a url',
		});

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Field "url" must be a valid URL string.');
	});

	it('accepts valid optional fields', () => {
		const result = validateAtom('company', {
			name: 'Intuition Labs',
			url: 'https://intuition.systems',
			sameAs: ['https://github.com/0xintuition'],
		});

		expect(result.valid).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it('reports multiple issues at once', () => {
		const result = validateAtom('web-page', {
			name: '',
			url: 'bad',
			extra: true,
		});

		expect(result.valid).toBe(false);
		expect(result.issues.length).toBeGreaterThanOrEqual(3);
	});

	it('validates iso-date format', () => {
		const result = validateAtom('event', {
			name: 'ETHDenver',
			startDate: 'not-a-date',
		});

		expect(result.valid).toBe(false);
		expect(result.issues).toContain('Field "startDate" must be an ISO date string (YYYY-MM-DD).');
	});

	it('accepts valid iso-date format', () => {
		const result = validateAtom('event', {
			name: 'ETHDenver 2026',
			startDate: '2026-02-26',
		});

		expect(result.valid).toBe(true);
	});
});

describe('isValidAtomData', () => {
	it('returns true for valid JSON-LD atom data', () => {
		expect(
			isValidAtomData(
				'{"@context":"https://schema.org/","@type":"Person","givenName":"Vitalik","familyName":"Buterin"}'
			)
		).toBe(true);
	});

	it('returns true for non-schema JSON object atom data', () => {
		expect(
			isValidAtomData('{"chainId":"1","address":"0x0000000000000000000000000000000000000001"}')
		).toBe(true);
	});

	it('returns false for non-JSON strings', () => {
		expect(isValidAtomData('not json')).toBe(false);
	});

	it('returns false for JSON arrays', () => {
		expect(isValidAtomData('[1,2,3]')).toBe(false);
	});

	it('returns false for JSON primitives', () => {
		expect(isValidAtomData('42')).toBe(false);
		expect(isValidAtomData('"hello"')).toBe(false);
		expect(isValidAtomData('true')).toBe(false);
		expect(isValidAtomData('null')).toBe(false);
	});

	it('returns false for empty strings', () => {
		expect(isValidAtomData('')).toBe(false);
	});

	it('returns true for empty objects', () => {
		expect(isValidAtomData('{}')).toBe(true);
	});
});
