import { describe, expect, it } from 'vitest';
import {
	buildClassificationSearchText,
	CLASSIFICATION_SEARCH_TEXT_MAX_LENGTH,
	getClassification,
} from './index.js';

describe('classification search text', () => {
	it('derives display search text without identifier values (reference anchor case)', () => {
		const fields = getClassification('movie')!.fields;
		expect(
			buildClassificationSearchText(
				fields,
				{ name: 'Inception', sameAs: ['https://evidence.example/inception'] },
				'Inception'
			)
		).toBe('Inception');
		expect(
			buildClassificationSearchText(
				fields,
				{ name: 'int:wd:Q25188', sameAs: ['https://evidence.example/inception'] },
				'int:wd:Q25188'
			)
		).toBe('');
	});
	it('includes string fields and arrays in order, deduplicates, and omits non-text fields', () => {
		expect(
			buildClassificationSearchText(
				[
					{ key: 'name', fieldType: 'string' },
					{ key: 'artist', fieldType: 'string' },
					{ key: 'tags', fieldType: 'string[]' },
					{ key: 'url', fieldType: 'url' },
					{ key: 'year', fieldType: 'number' },
				],
				{
					name: 'ignored',
					artist: ' Artist ',
					tags: ['Artist', 'Album', ' HTTPS://example.com', 'INT:wd:Q42', 12, ' '],
					url: 'https://example.com',
					year: 2026,
				},
				' Song '
			)
		).toBe('Song Artist Album');
	});
	it('reads corpus names from description, author, and about with no object coercion', () => {
		expect(
			buildClassificationSearchText(
				[],
				{
					description: [' Essay ', { name: 'Essay' }, { name: 'http://example.com' }, { name: 10 }],
					author: [{ name: ' Author ' }, 'Editor', null, []],
					about: { name: 'Subject' },
				},
				'Title'
			)
		).toBe('Title Essay Author Editor Subject');
	});
	it('keeps the authoritative base unbounded and exports the consumer cap', () => {
		const text = 'x'.repeat(20_001);
		expect(CLASSIFICATION_SEARCH_TEXT_MAX_LENGTH).toBe(20_000);
		expect(buildClassificationSearchText([], {}, text)).toBe(text);
	});
	it('omits absent, blank, URL-like, and non-string primary text', () => {
		for (const primary of [
			undefined,
			null,
			12,
			{},
			[],
			' ',
			'https://example.com',
			'int:isbn:9780684832722',
		]) {
			expect(buildClassificationSearchText([], {}, primary)).toBe('');
		}
	});
});
