import { describe, expect, test } from 'bun:test';
import {
	buildOpenLibraryWorkArtifactFromDump,
	createOpenLibraryPlugin,
	type OpenLibraryDumpAuthor,
} from '../../src/plugins/providers';
import { createPinAwareFetch } from '../../src/plugins/providers/__shared__/http';
import { createMockAtomInput, createMockRequest } from '../../src/testing';

type ParityFixture = {
	authors: OpenLibraryDumpAuthor[];
	candidate_id: number;
	matched_via: string;
	ol_key: string;
	record: Record<string, unknown>;
};

const FIXED_NOW = '2026-07-10T22:00:00.000Z';
const fixtureUrl = new URL(
	'../../src/plugins/providers/openlibrary/__fixtures__/dump-work-parity.json',
	import.meta.url
);
const fixtures = (await Bun.file(fixtureUrl).json()) as ParityFixture[];

describe('OpenLibrary dump hydrate parity', () => {
	for (const fixture of fixtures) {
		test(`${fixture.ol_key} is deep-equal to the current API work path`, async () => {
			const authorByKey = new Map(fixture.authors.map((author) => [author.key, author]));
			const plugin = createOpenLibraryPlugin({
				fetch: createPinAwareFetch(async (url) => {
					const pathname = new URL(String(url)).pathname.replace(/\.json$/, '');
					if (pathname === `/works/${fixture.ol_key}`) {
						return Response.json(fixture.record);
					}
					const author = authorByKey.get(pathname);
					if (author) {
						return Response.json(author);
					}
					return Response.json({ error: 'fixture route missing' }, { status: 404 });
				}),
				requestSpacingMs: 0,
			});
			const apiArtifacts = await plugin.enrich(
				createMockRequest({
					input: createMockAtomInput({
						hints: { url: `https://openlibrary.org/works/${fixture.ol_key}` },
					}),
				}),
				{
					now: () => FIXED_NOW,
					signal: new AbortController().signal,
				}
			);
			const hydratedArtifact = buildOpenLibraryWorkArtifactFromDump({
				authors: fixture.authors,
				fetchedAt: FIXED_NOW,
				record: fixture.record,
			});

			expect(apiArtifacts).toEqual([hydratedArtifact]);
			expect(hydratedArtifact.data).not.toHaveProperty('ratings');
		});
	}
});
