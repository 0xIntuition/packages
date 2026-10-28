import { describe, expect, test } from 'bun:test';
import {
	DATA_RESOLVED_MAX_BYTES,
	dataResolvedSchema,
	sanitizeMaterializedDataResolved,
	sanitizeProjectedDataResolvedWithinBudget,
} from '../src/data-resolved-schema';

const trailer = {
	'@type': 'VideoObject' as const,
	name: 'Trailer',
	url: 'https://www.youtube.com/watch?v=abcdefghijk',
	embedUrl: 'https://www.youtube.com/embed/abcdefghijk',
	thumbnailUrl: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
	inLanguage: 'en-US',
	uploadDate: '2026-01-01T00:00:00Z',
};

describe('data_resolved VideoObject trailer', () => {
	test('round-trips through schema and both sanitizers unchanged', () => {
		const document = { '@type': 'Movie', trailer };
		expect(dataResolvedSchema.parse(document)).toEqual(document);
		expect(sanitizeMaterializedDataResolved(document)).toEqual(document);
		expect(sanitizeProjectedDataResolvedWithinBudget(document, {})).toEqual(document);
	});
	test.each([
		{ url: 'https://vimeo.com/abcdefghijk' },
		{ url: 'https://www.youtube.com/watch?v=short' },
		{ embedUrl: 'https://www.youtube.com/embed/short' },
		{ thumbnailUrl: 'https://i.ytimg.com/vi/short/hqdefault.jpg' },
		{ extra: true },
		{ name: '' },
		{ name: 'x'.repeat(513) },
		{ inLanguage: 'x'.repeat(65) },
		{ uploadDate: 'yesterday' },
	])('rejects invalid trailer directly and drops it during sanitization %j', (fields) => {
		const document = { '@type': 'Movie', trailer: { ...trailer, ...fields } };
		expect(dataResolvedSchema.safeParse(document).success).toBe(false);
		expect(sanitizeMaterializedDataResolved(document)).toEqual({ '@type': 'Movie' });
		expect(sanitizeProjectedDataResolvedWithinBudget(document, {})).toEqual({ '@type': 'Movie' });
		// Existing optional parsed fields follow this same drop-on-invalid policy.
		expect(sanitizeMaterializedDataResolved({ '@type': 'Movie', duration: 'invalid' })).toEqual({
			'@type': 'Movie',
		});
	});
});

describe('F1 trailer admission budget', () => {
	test('drops a valid trailer at exactly 65536 bytes and preserves every other byte', () => {
		const base = { '@type': 'Movie', description: '' };
		base.description = 'x'.repeat(DATA_RESOLVED_MAX_BYTES - JSON.stringify(base).length);
		const expected = dataResolvedSchema.parse(base);
		expect(new TextEncoder().encode(JSON.stringify(expected)).byteLength).toBe(
			DATA_RESOLVED_MAX_BYTES
		);
		const result = sanitizeProjectedDataResolvedWithinBudget({ ...base, trailer }, base);
		expect(result).not.toHaveProperty('trailer');
		expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
	});
	test('the plain sanitizer also drops a valid trailer at exactly 65536 bytes', () => {
		const base = { '@type': 'Movie', description: '' };
		base.description = 'x'.repeat(DATA_RESOLVED_MAX_BYTES - JSON.stringify(base).length);
		const expected = dataResolvedSchema.parse(base);
		const result = sanitizeMaterializedDataResolved({ ...base, trailer });
		expect(result).not.toHaveProperty('trailer');
		expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
	});
	test('irreducible overflow still fails loud with or without a trailer', () => {
		const base = { '@type': 'Movie', description: 'x'.repeat(DATA_RESOLVED_MAX_BYTES) };
		expect(() => sanitizeMaterializedDataResolved(base)).toThrow(/exceeds/);
		expect(() => sanitizeMaterializedDataResolved({ ...base, trailer })).toThrow(/exceeds/);
	});
	test('rejects uploadDate longer than 64 characters', () => {
		const uploadDate = `2020-01-01T00:00:00.${'1'.repeat(65)}Z`;
		expect(
			dataResolvedSchema.safeParse({ '@type': 'Movie', trailer: { ...trailer, uploadDate } })
				.success
		).toBe(false);
	});
});
