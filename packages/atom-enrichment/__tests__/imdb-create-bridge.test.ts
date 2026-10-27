import { afterEach, expect, test } from 'bun:test';
import {
	createImdbPlugin,
	createServerEngine,
	createV0TypeProfilesPlugin,
} from '../../atom-classification/src';
import { createEnrichmentEngine } from '../src/engine';
import { toClassifiedAtomInput } from '../src/handoff';
import { isAllowedOpenGraphPageSource } from '../src/image-policy';
import { createPinAwareFetch, fetchText } from '../src/plugins/providers/__shared__/http';
import { getRequestUrl } from '../src/plugins/providers/__shared__/request';
import { serverDefaultPreset } from '../src/presets/bundles';
import { enrichmentRequestSchema } from '../src/types';

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test('default worker preset enriches a classified IMDb hit with a TMDB poster and never fetches IMDb', async () => {
	const requests: string[] = [];
	const fetcher = async (input: string | URL | Request) => {
		const url = new URL(String(input));
		requests.push(url.origin + url.pathname);
		if (url.pathname.includes('/find/'))
			return Response.json({ movie_results: [{ id: 550, title: 'Fight Club' }], tv_results: [] });
		if (url.pathname === '/3/movie/550')
			return Response.json({
				id: 550,
				title: 'Fight Club',
				poster_path: '/poster.jpg',
				imdb_id: 'tt0137523',
			});
		return Response.json({});
	};
	globalThis.fetch = fetcher as typeof fetch;
	const rawInput = 'https://www.imdb.com/title/tt0137523/';
	const classification = await createServerEngine({
		onClassifierError: () => undefined,
		plugins: [
			createV0TypeProfilesPlugin(),
			createImdbPlugin({
				apiKey: 'fixture-key',
				fetch: createPinAwareFetch(fetcher),
				resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
			}),
		],
	}).classify({ input: rawInput, mode: 'server-only' });
	const input = toClassifiedAtomInput(rawInput, classification);
	expect(input).not.toBeNull();
	if (!input) throw new Error('Expected enrichment input');
	const run = await createEnrichmentEngine({
		plugins: serverDefaultPreset({
			tmdb: { apiKey: 'fixture-key', fetch: createPinAwareFetch(fetcher) },
		}),
	}).enrich({ input, runtime: 'server' });
	expect(run.artifacts.find((artifact) => artifact.artifact_type === 'tmdb')?.data).toMatchObject({
		tmdbId: 550,
		posterUrl: 'https://image.tmdb.org/t/p/original/poster.jpg',
	});
	expect(requests.filter((url) => /(^|\.)imdb\.com\.?$/i.test(new URL(url).hostname))).toEqual([]);
	expect(requests).toContain('https://api.themoviedb.org/3/movie/550');
});

for (const host of ['imdb.com', 'WWW.IMDB.COM.', 'sub.imdb.com']) {
	test(`enrichment rejects ${host} directly and through redirects`, async () => {
		const url = `https://${host}/title/tt0137523/`;
		const request = enrichmentRequestSchema.parse({
			runtime: 'server',
			input: {
				atomType: 'thing',
				jsonLd: { url, sameAs: [url] },
				hints: { url },
				source: { classificationEngine: 'fixture', classifiedAt: '2026-09-24T00:00:00Z' },
			},
		});
		expect(getRequestUrl(request)).toBeUndefined();
		expect(isAllowedOpenGraphPageSource(url, { genericUserPasted: true })).toBe(false);
		const requests: string[] = [];
		const fetcher = async (value: string) => {
			requests.push(value);
			return new Response(null, { status: 302, headers: { location: url } });
		};
		await expect(fetchText(createPinAwareFetch(fetcher), url)).rejects.toMatchObject({
			errorClass: 'embargoed_host',
		});
		await expect(
			fetchText(createPinAwareFetch(fetcher), 'https://example.com/redirect')
		).rejects.toMatchObject({
			errorClass: 'embargoed_host',
		});
		expect(requests).toEqual(['https://example.com/redirect']);
	});
}
