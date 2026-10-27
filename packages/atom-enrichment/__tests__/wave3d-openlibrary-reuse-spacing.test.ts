import { describe, expect, it } from 'bun:test';
import { createEnrichmentEngine } from '../src/engine';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';
import { createOpenLibraryPlugin } from '../src/plugins/providers/openlibrary';

const FIXED_TIME = '2040-01-01T00:00:00.000Z';

describe('Wave 3D OpenLibrary reuse spacing', () => {
	it('serializes request spacing across concurrent runs of one plugin instance', async () => {
		const startedAt: number[] = [];
		const plugin = createOpenLibraryPlugin({
			requestSpacingMs: 30,
			maxAuthorFetches: 0,
			fetch: createPinAwareFetch(async (input) => {
				startedAt.push(performance.now());
				const workId = new URL(String(input)).pathname.split('/').at(-1)?.replace('.json', '');
				// covers present so the ENG-15150 edition-cover fallback does not add
				// a second fetch per work; this test pins spacing, one fetch per work.
				return new Response(
					JSON.stringify({ covers: [123], key: `/works/${workId}`, title: `Work ${workId}` }),
					{
						headers: { 'content-type': 'application/json' },
						status: 200,
					}
				);
			}),
		});
		const engine = createEnrichmentEngine({
			plugins: [plugin],
			now: () => FIXED_TIME,
		});

		const [first, second] = await Promise.all([
			engine.enrich(requestFor('OL1W')),
			engine.enrich(requestFor('OL2W')),
		]);

		expect(first.status).toBe('success');
		expect(second.status).toBe('success');
		expect(startedAt).toHaveLength(2);
		expect((startedAt[1] ?? 0) - (startedAt[0] ?? 0)).toBeGreaterThanOrEqual(25);
	});
});

function requestFor(workId: string) {
	return {
		input: {
			atomType: 'thing' as const,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'Book',
				name: `Work ${workId}`,
				url: `https://openlibrary.org/works/${workId}`,
			},
			source: {
				classificationEngine: 'wave3d-test',
				classifiedAt: FIXED_TIME,
			},
			hints: { url: `https://openlibrary.org/works/${workId}` },
		},
		runtime: 'server' as const,
		plugins: ['openlibrary'],
	};
}
