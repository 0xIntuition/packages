import { describe, expect, mock, setDefaultTimeout, test } from 'bun:test';
import { createMemoryCacheAdapter } from '../../cache';
import { createEnrichmentEngine } from '../../engine';
import { createMockAtomInput, createMockRequest } from '../../testing';
import { createPinAwareFetch } from './__shared__/http';
import { createMicrodataPlugin } from './microdata';
import { createOpenGraphPlugin } from './opengraph';

/**
 * The shared page fetch is shaped only by the plugins that actually run (ENG-16980 review, round 2):
 * a plugin the engine's artifact cache already serves never dials, so it must not widen the request.
 */

// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials; a real lookup would make these tests depend on the network. Nothing is dialled.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

setDefaultTimeout(60_000);
const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];
const LD =
	'<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"W"}</script>';
const OK_PAGE = `<html><head><title>T</title><meta property="og:title" content="T"></head><body>${LD}</body></html>`;
const HTML = { 'content-type': 'text/html' };
const request = (url: string) =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Thing', name: 'T', url },
		}),
	});
// Cache freshness is judged against the real clock, so a fixed test date would be stale.
const now = () => new Date().toISOString();

describe('plugins served from the artifact cache do not shape the shared request', () => {
	test('opengraph served from cache: microdata alone never dials TMDB behind a redirect, on any repeat', async () => {
		const urls: string[] = [];
		const fetcher = createPinAwareFetch(async (url) => {
			urls.push(url);
			return url.includes('themoviedb')
				? new Response(OK_PAGE, { status: 200, headers: HTML })
				: new Response(null, {
						status: 301,
						headers: { location: 'https://www.themoviedb.org/movie/1' },
					});
		});
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
				createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
			],
			now,
		});
		const url = 'https://artifactcache-tmdb.example/p';

		// Run 1: opengraph follows the redirect (its policy allows TMDB pages), microdata gets 451.
		const first = await engine.enrich(request(url));
		expect(urls).toEqual([url, 'https://www.themoviedb.org/movie/1']);
		expect(first.artifacts.map((a) => a.artifact_type)).toEqual(['opengraph']);

		for (const run of [2, 3]) {
			urls.length = 0;
			const again = await engine.enrich(request(url));
			// opengraph is served from the cache, so only microdata runs: it must stop at the
			// redirect without dialling TMDB, exactly as when it ran alone before sharing.
			expect(again.timings?.cacheHits, `run ${run}`).toBe(1);
			expect(urls, `run ${run}`).toEqual([url]);
			const microdata = again.errors.find((e) => e.pluginId === 'microdata');
			expect(microdata?.details).toMatchObject({ status: 451, errorClass: 'embargoed_host' });
		}
	});

	test('microdata served from cache: opengraph still stops at </head>', async () => {
		let pulls = 0;
		const filler = 'x'.repeat(4096);
		const fetcher = createPinAwareFetch(async () => {
			let index = 0;
			return new Response(
				new ReadableStream<Uint8Array>({
					pull(controller) {
						pulls += 1;
						if (index === 0) {
							controller.enqueue(
								new TextEncoder().encode(
									`<html><head><title>T</title><meta property="og:title" content="T"></head><body>${LD}`
								)
							);
						} else if (index < 200) {
							controller.enqueue(new TextEncoder().encode(filler));
						} else {
							controller.enqueue(new TextEncoder().encode('</body></html>'));
							controller.close();
						}
						index += 1;
					},
				}),
				{ status: 200, headers: HTML }
			);
		});
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			// opengraph is never cached (TTL 0); microdata is.
			plugins: [
				createOpenGraphPlugin({ fetch: fetcher, resolveHostname, TTL: 0 }),
				createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
			],
			now,
		});
		const url = 'https://artifactcache-body.example/p';

		await engine.enrich(request(url));
		// Both plugins ran: microdata needs the body, so the whole page was read.
		expect(pulls).toBeGreaterThan(190);

		pulls = 0;
		const again = await engine.enrich(request(url));
		expect(again.timings?.cacheHits).toBe(1);
		expect(again.artifacts.map((a) => a.artifact_type).sort()).toEqual(['microdata', 'opengraph']);
		// Only opengraph dialled: it stops at </head>, as when it runs alone.
		expect(pulls).toBeLessThanOrEqual(2);
	});

	test('a cache that fails to read counts as a miss: both plugins still shape the request', async () => {
		const memory = createMemoryCacheAdapter();
		const failing = {
			...memory,
			get: async () => {
				throw new Error('cache down');
			},
		};
		const urls: string[] = [];
		const fetcher = createPinAwareFetch(async (url) => {
			urls.push(url);
			return new Response(OK_PAGE, { status: 200, headers: HTML });
		});
		const result = await createEnrichmentEngine({
			cache: failing,
			plugins: [
				createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
				createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
			],
			now,
		}).enrich(request('https://artifactcache-down.example/p'));
		expect(urls).toHaveLength(1);
		expect(result.artifacts.map((a) => a.artifact_type).sort()).toEqual(['microdata', 'opengraph']);
	});
});
