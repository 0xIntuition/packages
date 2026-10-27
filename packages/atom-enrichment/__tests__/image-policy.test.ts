import { describe, expect, test } from 'bun:test';
import {
	IMAGE_PROVENANCE_FIELDS,
	isAdmissibleMaterializedImage,
	isAllowedOpenGraphPageSource,
	isPublicHttpsUrl,
	OPEN_GRAPH_PAGE_SOURCE_RULES,
	readHttpUrl,
} from '../src/image-policy';

describe('image policy public URL shape', () => {
	test('accepts a plain public https image URL', () => {
		expect(isPublicHttpsUrl('https://upload.wikimedia.org/x.jpg')).toBe(true);
		expect(readHttpUrl('https://a.ltrbxd.com/resized/x.jpg')).toBe(
			'https://a.ltrbxd.com/resized/x.jpg'
		);
	});

	test('rejects non-default ports alongside the existing structural rejections (R3 finding 1)', () => {
		for (const value of [
			'https://example.com:444/x.jpg',
			'https://example.com:8443/x.jpg',
			'javascript:alert(1)',
			'https://user:pass@example.com/x.jpg',
		]) {
			expect(isPublicHttpsUrl(value)).toBe(false);
			expect(readHttpUrl(value)).toBeUndefined();
		}
		expect(isPublicHttpsUrl('http://example.com/x.jpg')).toBe(false);
	});
});

test('admits licensed TMDB sources without broadening other page or image admission', () => {
	expect(isAllowedOpenGraphPageSource('https://www.themoviedb.org/movie/550')).toBe(true);
	expect(
		isAdmissibleMaterializedImage({
			imageUrl: 'https://image.tmdb.org/t/p/original/poster.jpg',
			pageSourceUrl: 'https://www.themoviedb.org/movie/550',
		})
	).toBe(true);
	expect(isAllowedOpenGraphPageSource('https://unapproved.example/page')).toBe(false);
	expect(isAllowedOpenGraphPageSource('https://themoviedb.org.evil.example/page')).toBe(false);
	expect(isAdmissibleMaterializedImage({ imageUrl: 'https://127.0.0.1/poster.jpg' })).toBe(false);
	expect(
		OPEN_GRAPH_PAGE_SOURCE_RULES.find((rule) => rule.host === 'themoviedb.org')?.reason
	).toContain('2026-09-01');
	expect(
		OPEN_GRAPH_PAGE_SOURCE_RULES.find((rule) => rule.host === 'themoviedb.org')?.reason
	).toContain('2026-09-16');
	expect(IMAGE_PROVENANCE_FIELDS).toEqual([
		'image_license',
		'image_checked_at',
		'image_any_license',
		'image_any_checked_at',
	]);
});
