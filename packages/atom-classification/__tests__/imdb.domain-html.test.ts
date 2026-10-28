import { describe, expect, it } from 'bun:test';
import { createClassificationEngine } from '../src/engine';
import { createImdbPlugin, createV0TypeProfilesPlugin } from '../src/index';

describe('IMDb catalog transport (page adapters removed)', () => {
	it('acquires a title through the suggestion transport after a catalog miss', async () => {
		const requests: string[] = [];
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createImdbPlugin({
					apiKey: 'fixture-key',
					resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
					fetch: async (url) => {
						requests.push(new URL(url).hostname);
						return url.includes('/find/')
							? Response.json({ movie_results: [], tv_results: [] })
							: Response.json({ d: [{ id: 'tt0133093', l: 'The Matrix' }] });
					},
				}),
			],
		});
		const result = await engine.classify({
			input: 'https://www.imdb.com/title/tt0133093/',
			mode: 'server-only',
		});
		expect(requests).toEqual(['api.themoviedb.org', 'v2.sg.media-imdb.com']);
		expect(result.resolved?.atoms[0]?.title).toBe('The Matrix');
		expect(result.resolved?.atoms[0]?.metadata.imdbBridge).toEqual({ status: 'miss', hits: 0 });
	});
	for (const status of [200, 503]) {
		it(`handles a person suggestion status ${status} without a generic placeholder`, async () => {
			const requests: string[] = [];
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				runtime: 'server',
				plugins: [
					createV0TypeProfilesPlugin(),
					createImdbPlugin({
						resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
						fetch: async (url) => {
							requests.push(new URL(url).hostname);
							return Response.json({ d: [{ id: 'nm0000206', l: 'Keanu Reeves' }] }, { status });
						},
					}),
				],
			});
			const result = await engine.classify({
				input: 'https://www.imdb.com/name/nm0000206/',
				mode: 'server-only',
			});
			expect(requests).toEqual(['v2.sg.media-imdb.com']);
			if (status === 200) {
				expect(result.resolved?.atoms[0]?.title).toBe('Keanu Reeves');
				expect(result.resolved?.atoms[0]?.metadata.imdbBridge).toEqual({ status: 'miss', hits: 0 });
			} else {
				expect(result.resolved?.atoms ?? []).toEqual([]);
				expect(result.classification?.meta.acquisitionOutcome).toMatchObject({
					status: 'unavailable',
					terminal: true,
				});
			}
		});
	}
});
