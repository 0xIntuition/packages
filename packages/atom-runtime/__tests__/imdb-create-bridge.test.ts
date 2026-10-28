import { afterEach, expect, test } from 'bun:test';
import { toClassifiedAtomInput } from '@0xintuition/atom-enrichment';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { createAtomServicesProcessingRuntime } from '../src/consumers';

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test('worker composition consumes only the supplied TMDB_API_KEY and emits a poster', async () => {
	const requests: string[] = [];
	// Providers dial through the pinned transport and ignore an unmarked global
	// fetch, so the fixture declares itself a pin-aware transport.
	globalThis.fetch = createPinAwareFetch(
		async (input: string | URL | Request, init?: RequestInit) => {
			const url = new URL(String(input));
			requests.push(url.origin + url.pathname);
			if (url.hostname === 'api.themoviedb.org') {
				expect(url.searchParams.get('api_key')).toBe('fixture-key');
				// Classification calls TMDB with redirect 'error'; enrichment goes through the
				// shared helper, which owns redirect policy and dials each pinned hop as 'manual'.
				expect(['error', 'manual']).toContain(init?.redirect ?? 'missing');
				if (url.pathname.includes('/find/'))
					return Response.json({
						movie_results: [{ id: 550, title: 'Fight Club' }],
						tv_results: [],
					});
				if (url.pathname === '/3/movie/550')
					return Response.json({
						id: 550,
						title: 'Fight Club',
						poster_path: '/poster.jpg',
						imdb_id: 'tt0137523',
					});
			}
			return Response.json({ query: { search: [] } });
		}
	) as unknown as typeof fetch;
	const runtime = createAtomServicesProcessingRuntime({
		env: { TMDB_API_KEY: 'fixture-key' },
		cacheProvider: 'none',
		onClassifierError: () => undefined,
	});
	const url = 'https://www.imdb.com/title/tt0137523/';
	const classified = await runtime.classification
		.createEngine()
		.classify({ input: url, mode: 'server-only', pluginIds: ['imdb'] });
	expect(classified.resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
	const input = toClassifiedAtomInput(url, classified);
	if (!input) throw new Error('Expected worker input');
	const enriched = await runtime.enrichment
		.createEngine('default')
		.enrich({ input, runtime: 'server' });
	expect(
		enriched.artifacts.find((artifact) => artifact.artifact_type === 'tmdb')?.data.posterUrl
	).toBe('https://image.tmdb.org/t/p/original/poster.jpg');
	expect(requests.some((value) => new URL(value).hostname.endsWith('imdb.com'))).toBe(false);
});
