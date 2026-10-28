import { describe, expect, it } from 'bun:test';
import { resolveWikidataEntityLabels } from '../src/extraction/wikidata-claims';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';
import { createWikidataPlugin } from '../src/plugins/providers/wikidata';
import { createMockAtomInput, createMockRequest } from '../src/testing';

describe('Wikidata reader locale policy', () => {
	for (const [locale, expected] of [
		['mul', 'Toy Story'],
		['en-gb', 'Toy Story'],
		['en', 'Toy Story'],
		['ja', undefined],
	] as const) {
		const entity = {
			id: 'Q171048',
			labels: { dv: { value: 'ޓޯއި ސްޓޯރީ' }, [locale]: { value: 'Toy Story' } },
			descriptions: { dv: { value: 'unapproved description' }, [locale]: { value: '1995 film' } },
		};
		const fetcher = async () =>
			new Response(JSON.stringify({ entities: { Q171048: entity } }), { status: 200 });
		it(`resolves ${locale} claim labels with the shared policy`, async () => {
			const labels = await resolveWikidataEntityLabels(createPinAwareFetch(fetcher), ['Q171048']);
			expect(labels.get('Q171048')).toBe(expected);
		});
		it(`emits only approved ${locale} provider labels and descriptions`, async () => {
			const plugin = createWikidataPlugin({ fetch: createPinAwareFetch(fetcher) });
			const request = createMockRequest({
				input: createMockAtomInput({
					hints: {
						name: 'TMDB Toy Story',
						identifiers: { wikidata: 'Q171048' },
					},
				}),
			});
			const artifacts = await plugin.enrich(request, {
				now: () => '2026-10-01T00:00:00.000Z',
				signal: new AbortController().signal,
			});
			if (expected) {
				expect(artifacts[0]?.data).toMatchObject({ label: expected, description: '1995 film' });
			} else {
				expect(artifacts).toEqual([]);
			}
		});
	}
	it('never emits a QID as a display label when labels are absent', async () => {
		const plugin = createWikidataPlugin({
			fetch: createPinAwareFetch(
				async () =>
					new Response(JSON.stringify({ entities: { Q171048: { id: 'Q171048' } } }), {
						status: 200,
					})
			),
		});
		const request = createMockRequest({
			input: createMockAtomInput({ hints: { identifiers: { wikidata: 'Q171048' } } }),
		});
		expect(
			await plugin.enrich(request, {
				now: () => '2026-10-01T00:00:00.000Z',
				signal: new AbortController().signal,
			})
		).toEqual([]);
	});
});
