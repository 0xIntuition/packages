import { describe, expect, it } from 'bun:test';
import { createEnrichmentEngine } from '../../src/engine';
import { createPinAwareFetch } from '../../src/plugins/providers/__shared__/http';
import { createWikipediaPlugin } from '../../src/plugins/providers/wikipedia';
import { createMockAtomInput, createMockRequest } from '../../src/testing';

describe('wikipedia placeholder title guard', () => {
	it('records a typed skip without looking up a Goodreads generic placeholder', async () => {
		let fetchCallCount = 0;
		const engine = createEnrichmentEngine({
			plugins: [
				createWikipediaPlugin({
					fetch: createPinAwareFetch(async () => {
						fetchCallCount += 1;
						return new Response('{}', { status: 404 });
					}),
				}),
			],
		});
		const name = 'Goodreads Book 52036';
		const url = 'https://www.goodreads.com/book/show/52036';

		const result = await engine.enrich(
			createMockRequest({
				input: createMockAtomInput({
					jsonLd: {
						'@context': 'https://schema.org',
						'@type': 'Book',
						name,
						url,
					},
					source: {
						classificationEngine: '@0xintuition/atom-classification',
						classifiedAt: '2026-01-01T00:00:00.000Z',
						provider: 'goodreads',
					},
					hints: { name, url },
				}),
			})
		);

		expect(fetchCallCount).toBe(0);
		expect(result.artifacts).toEqual([]);
		expect(result.errors).toEqual([]);
		expect(result.skipped).toContainEqual({
			pluginId: 'wikipedia',
			reason: 'not_applicable',
		});
	});

	it('looks up an exact-pattern Goodreads title with OpenGraph provenance', async () => {
		const { fetchCallCount, result } = await enrichTitle({
			classificationEngine: '@0xintuition/atom-classification',
			name: 'Goodreads Book 52036',
			provider: 'goodreads-opengraph',
			url: 'https://www.goodreads.com/book/show/52036',
		});

		expect(fetchCallCount).toBe(1);
		expect(result.artifacts).toHaveLength(1);
	});

	it('looks up a non-Goodreads title even when the legacy engine name contains generic-resolver', async () => {
		const { fetchCallCount, result } = await enrichTitle({
			classificationEngine: 'legacy-generic-resolver',
			name: 'Goodreads Book 52036',
			url: 'https://example.com/books/52036',
		});

		expect(fetchCallCount).toBe(1);
		expect(result.artifacts).toHaveLength(1);
	});

	for (const [name, url] of [
		['OpenLibrary Book OL123M', 'https://openlibrary.org/books/OL123M'],
		['OpenLibrary Edition OL456M', 'https://openlibrary.org/books/OL456M'],
		['OpenLibrary Work OL789W', 'https://openlibrary.org/works/OL789W'],
	] as const) {
		it(`skips the classifier ${name} identifier grammar under generic provenance`, async () => {
			const { fetchCallCount, result } = await enrichTitle({
				classificationEngine: '@0xintuition/atom-classification',
				fallbackStage: 'generic',
				name,
				provider: 'openlibrary',
				url,
			});

			expect(fetchCallCount).toBe(0);
			expect(result.skipped).toContainEqual({
				pluginId: 'wikipedia',
				reason: 'not_applicable',
			});
		});
	}

	it('looks up a real OpenLibrary-titled book', async () => {
		const { fetchCallCount } = await enrichTitle({
			classificationEngine: '@0xintuition/atom-classification',
			fallbackStage: 'opengraph',
			name: 'OpenLibrary Book Club',
			provider: 'openlibrary',
			url: 'https://openlibrary.org/books/OL123M',
		});

		expect(fetchCallCount).toBe(1);
	});
});

async function enrichTitle(input: {
	classificationEngine: string;
	fallbackStage?: string;
	name: string;
	provider?: string;
	url: string;
}) {
	let fetchCallCount = 0;
	const engine = createEnrichmentEngine({
		plugins: [
			createWikipediaPlugin({
				fetch: createPinAwareFetch(async () => {
					fetchCallCount += 1;
					return Response.json({
						content_urls: {
							desktop: { page: 'https://en.wikipedia.org/wiki/Goodreads_Book_52036' },
						},
						extract: 'A real book title.',
						title: input.name,
					});
				}),
			}),
		],
	});
	const result = await engine.enrich(
		createMockRequest({
			input: createMockAtomInput({
				jsonLd: {
					'@context': 'https://schema.org',
					'@type': 'Book',
					name: input.name,
					url: input.url,
				},
				source: {
					classificationEngine: input.classificationEngine,
					classifiedAt: '2026-01-01T00:00:00.000Z',
					...(input.fallbackStage ? { fallbackStage: input.fallbackStage } : {}),
					...(input.provider ? { provider: input.provider } : {}),
				},
				hints: { name: input.name, url: input.url },
			}),
		})
	);

	return { fetchCallCount, result };
}
