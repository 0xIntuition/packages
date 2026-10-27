import { describe, expect, it } from 'bun:test';

import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

describe('openlibrary platform plugin', () => {
	const fixtures = [
		{
			variant: 'bare',
			input: 'https://openlibrary.org/works/OL45804W',
			subtype: 'work',
			olid: 'OL45804W',
			metaKey: 'workOlid',
			canonicalUrl: 'https://openlibrary.org/works/OL45804W',
			title: 'OpenLibrary Work OL45804W',
		},
		{
			variant: 'www slugged',
			input: 'http://www.openlibrary.org/works/OL45804W/The_Lord_of_the_Rings',
			subtype: 'work',
			olid: 'OL45804W',
			metaKey: 'workOlid',
			canonicalUrl: 'https://openlibrary.org/works/OL45804W',
			title: 'OpenLibrary Work OL45804W',
		},
		{
			variant: 'bare',
			input: 'https://openlibrary.org/books/OL7353617M',
			subtype: 'book',
			olid: 'OL7353617M',
			metaKey: 'editionOlid',
			canonicalUrl: 'https://openlibrary.org/books/OL7353617M',
			title: 'OpenLibrary Book OL7353617M',
		},
		{
			variant: 'www slugged',
			input: 'https://www.openlibrary.org/books/OL7353617M/The_Hobbit/',
			subtype: 'book',
			olid: 'OL7353617M',
			metaKey: 'editionOlid',
			canonicalUrl: 'https://openlibrary.org/books/OL7353617M',
			title: 'OpenLibrary Book OL7353617M',
		},
	] as const;

	for (const fixture of fixtures) {
		it(`classifies ${fixture.variant} OpenLibrary ${fixture.subtype} URL ${fixture.olid} as a Book`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input: fixture.input,
				mode: 'progressive',
				classificationSessionId: `openlibrary-${fixture.subtype}-${fixture.olid}`,
			});

			const atom = result.resolved?.atoms[0];

			expect(result.status).toBe('complete');
			expect(result.classification).toMatchObject({
				domain: 'openlibrary',
				subtype: fixture.subtype,
				confidence: 0.99,
				meta: {
					[fixture.metaKey]: fixture.olid,
					canonicalUrl: fixture.canonicalUrl,
				},
			});
			expect(result.resolved?.resolverId).toBe('openlibrary-resolver');
			expect(atom).toMatchObject({
				schemaType: 'Book',
				category: 'thing',
				title: fixture.title,
				canonicalId: `openlibrary:${fixture.subtype}:${fixture.olid}`,
				sameAs: [fixture.canonicalUrl],
			});
			expect(atom?.data).toMatchObject({
				'@type': 'Book',
				identifier: `openlibrary:${fixture.subtype}:${fixture.olid}`,
				url: fixture.canonicalUrl,
				sameAs: [fixture.canonicalUrl],
			});
			expect(atom?.metadata).toMatchObject({
				pluginId: 'openlibrary',
				provider: 'openlibrary',
				platform: 'openlibrary',
				subtype: fixture.subtype,
			});
		});
	}

	const nonMatches = [
		'https://openlibrary.example/works/OL45804W',
		'https://openlibrary.org/authors/OL23919A',
		'https://openlibrary.org/works/OL45804M',
		'https://openlibrary.org/books/OL7353617W',
		'https://openlibrary.org/books/not-an-olid',
		'https://openlibrary.org/works/OL45804W/title/extra',
	] as const;

	for (const input of nonMatches) {
		it(`does not classify unsupported OpenLibrary URL ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `openlibrary-non-match-${nonMatches.indexOf(input)}`,
				pluginIds: ['openlibrary'],
			});

			expect(result.classification).toBeUndefined();
			expect(result.resolved).toBeUndefined();
		});
	}
});
