import { describe, expect, test } from 'bun:test';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../../testing';
import { createPinAwareFetch } from '../__shared__/http';
import { createOpenLibraryPlugin } from './index';

const fixture = (name: string) => new URL(`./__fixtures__/${name}`, import.meta.url);

async function fixtureJson(name: string): Promise<unknown> {
	return await Bun.file(fixture(name)).json();
}

function workRequest() {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { url: 'https://openlibrary.org/works/OL45804W' },
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'Book',
				name: 'Fantastic Mr Fox',
				url: 'https://openlibrary.org/works/OL45804W',
			},
		}),
	});
}

describe('OpenLibrary work edition-cover fallback', () => {
	test('work without a positive cover uses the best covered edition fixture', async () => {
		const calls: string[] = [];
		const plugin = createOpenLibraryPlugin({
			maxAuthorFetches: 0,
			requestSpacingMs: 0,
			fetch: createPinAwareFetch(async (input) => {
				const url = new URL(String(input));
				calls.push(`${url.pathname}${url.search}`);
				if (url.pathname.endsWith('/editions.json')) {
					return Response.json(await fixtureJson('editions-with-covers.json'));
				}
				return Response.json(await fixtureJson('work-without-cover.json'));
			}),
		});

		const [artifact] = await plugin.enrich(workRequest(), createMockPluginContext());

		expect(calls).toEqual(['/works/OL45804W.json', '/works/OL45804W/editions.json?limit=20']);
		expect(artifact?.data).toMatchObject({
			coverId: 200,
			editionOlid: 'OL20M',
			openLibraryUrl: 'https://openlibrary.org/works/OL45804W',
			workOlid: 'OL45804W',
		});
		expect(artifact?.data.schemaOrg).toMatchObject({
			image: 'https://covers.openlibrary.org/b/id/200-L.jpg',
			url: 'https://openlibrary.org/works/OL45804W',
		});
	});

	test('work with a positive cover is unchanged', async () => {
		const work = await fixtureJson('work.json');
		const calls: string[] = [];
		const plugin = createOpenLibraryPlugin({
			maxAuthorFetches: 0,
			requestSpacingMs: 0,
			fetch: createPinAwareFetch(async (input) => {
				const url = new URL(String(input));
				calls.push(`${url.pathname}${url.search}`);
				if (url.pathname.endsWith('/editions.json')) {
					throw new Error('editions lookup must not run');
				}
				return Response.json(work);
			}),
		});

		const [artifact] = await plugin.enrich(workRequest(), createMockPluginContext());

		expect(calls).toEqual(['/works/OL45804W.json']);
		expect(artifact?.data).toMatchObject({
			coverId: 6_498_519,
			openLibraryUrl: 'https://openlibrary.org/works/OL45804W',
		});
		expect(artifact?.data.schemaOrg).toMatchObject({
			image: 'https://covers.openlibrary.org/b/id/6498519-L.jpg',
		});
	});

	test('does not call editions when the work already has a positive cover', async () => {
		const work = await fixtureJson('work.json');
		let editionsCalls = 0;
		const plugin = createOpenLibraryPlugin({
			maxAuthorFetches: 0,
			requestSpacingMs: 0,
			fetch: createPinAwareFetch(async (input) => {
				const url = new URL(String(input));
				if (url.pathname.endsWith('/editions.json')) {
					editionsCalls += 1;
					return Response.json(await fixtureJson('editions-with-covers.json'));
				}
				return Response.json(work);
			}),
		});

		await plugin.enrich(workRequest(), createMockPluginContext());

		expect(editionsCalls).toBe(0);
	});
});
