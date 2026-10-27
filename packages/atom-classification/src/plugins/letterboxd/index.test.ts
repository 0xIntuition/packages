import { beforeEach, describe, expect, it } from 'bun:test';
import { projectIdentifierLadder } from '@0xintuition/iid-ladder';
import { resolvePublicTestHostname } from '../../../__tests__/helpers/public-dns';
import { createClientEngine, createServerEngine } from '../../index';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../shared/domain-html/fetch';
import { createTypeProfilesPlugin } from '../type-profiles';
import {
	createLetterboxdDomainHtmlAdapter,
	createLetterboxdOpenGraphAdapter,
	createLetterboxdPlugin,
	letterboxdProfile,
} from '.';

const FILM_URL = 'https://letterboxd.com/film/moonlight/';
const JSON_LD_FIXTURE = await Bun.file(
	new URL('./__fixtures__/movie-jsonld.html', import.meta.url)
).text();
const OPEN_GRAPH_FIXTURE = await Bun.file(
	new URL('./__fixtures__/movie-opengraph.html', import.meta.url)
).text();

describe('letterboxd plugin', () => {
	beforeEach(() => resetDomainHtmlHostCircuitBreakersForTests());

	for (const input of [
		FILM_URL,
		'https://www.letterboxd.com/film/moonlight/?utm_source=test#cast',
		'https://letterboxd.com/cinephile/film/moonlight/',
		'https://letterboxd.com/film/moonlight/crew/',
		'https://letterboxd.com/film/moonlight/reviews/by/activity/',
	]) {
		it(`canonicalizes ${input}`, async () => {
			const result = await clientEngine().classify({
				input,
				mode: 'client-only',
				classificationSessionId: `letterboxd-url-${input}`,
			});

			expect(result.classification).toMatchObject({
				domain: 'letterboxd',
				subtype: 'film',
				meta: { canonicalUrl: FILM_URL, slug: 'moonlight' },
			});
		});
	}

	it('classifies a TMDB bridge without calling the TMDB API', async () => {
		const result = await clientEngine().classify({
			input: 'https://letterboxd.com/tmdb/376867?from=share#details',
			mode: 'client-only',
			classificationSessionId: 'letterboxd-tmdb-bridge',
		});

		expect(result.classification).toMatchObject({
			domain: 'letterboxd',
			meta: {
				canonicalUrl: 'https://letterboxd.com/tmdb/376867',
				tmdbId: '376867',
			},
		});
	});

	it('declines short links and unrelated Letterboxd pages', () => {
		for (const input of [
			'https://boxd.it/abc123',
			'https://letterboxd.com/films/popular/',
			'https://notletterboxd.com/film/moonlight/',
		]) {
			expect(
				letterboxdProfile.classifier.classify(input, {
					input,
					inputIntent: 'url-first',
					mode: 'progressive',
					classificationSessionId: 'letterboxd-decline',
				})
			).toBeNull();
		}
	});

	it('uses Movie JSON-LD and the TMDB identity bridge', async () => {
		const { result, requestedHosts } = await classifyWithResponses([
			new Response(JSON_LD_FIXTURE, { status: 200 }),
		]);
		const atom = result.resolved?.atoms[0];

		expect(atom).toMatchObject({
			canonicalId: 'tmdb:movie:376867',
			description: 'A young man searches for his place in the world.',
			schemaType: 'Movie',
			title: 'Moonlight',
			data: {
				aggregateRating: { ratingValue: 4.2, ratingCount: 643000, bestRating: 5 },
				dateCreated: '2016-10-21',
				director: [{ '@type': 'Person', name: 'Barry Jenkins' }],
				genre: ['Drama'],
				image:
					'https://a.ltrbxd.com/resized/film-poster/2/4/0/3/4/4/240344-moonlight-0-500-0-750-crop.jpg',
			},
		});
		expect(atom?.sameAs).toEqual([
			FILM_URL,
			'https://letterboxd.com/tmdb/376867',
			'https://www.themoviedb.org/movie/376867',
			'https://www.imdb.com/title/tt4975722/',
		]);
		expect(projectIdentifierLadder({ providerCanonicalId: atom?.canonicalId })).toEqual({
			iid: 'int:tmdb:movie:376867',
			rung: 'handle',
		});
		expect(requestedHosts).toEqual(['letterboxd.com']);
	});

	it('omits aggregateRating when JSON-LD has no rating', async () => {
		const html = JSON_LD_FIXTURE.replace(/"aggregateRating": \{[^}]*\}/, '"unusedRating": null');
		const { result } = await classifyWithResponses([new Response(html, { status: 200 })]);
		expect(result.resolved?.atoms).toHaveLength(1);
		expect(result.resolved?.atoms[0]?.data).not.toHaveProperty('aggregateRating');
	});

	it('uses a provider-local identity when JSON-LD has no TMDB bridge', async () => {
		const html = JSON_LD_FIXTURE.replace(' data-tmdb-id="376867"', '').replace(
			/<a href="https:\/\/www\.themoviedb\.org\/movie\/376867">TMDB<\/a>/,
			''
		);
		const { result } = await classifyWithResponses([new Response(html, { status: 200 })]);

		expect(result.resolved?.atoms[0]?.canonicalId).toBe('letterboxd:film:moonlight');
		expect(projectIdentifierLadder({ providerCanonicalId: 'letterboxd:film:moonlight' })).toEqual({
			iid: 'int:letterboxd:film:moonlight',
			rung: 'handle',
		});
	});

	it('falls back from missing JSON-LD to Letterboxd OpenGraph fields', async () => {
		const { result } = await classifyWithResponses([
			new Response(OPEN_GRAPH_FIXTURE, { status: 200 }),
		]);

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'letterboxd:film:moonlight',
			description: 'A young man searches for his place in the world.',
			metadata: {
				acquisitionOutcome: {
					status: 'degraded',
					terminal: false,
				},
			},
			source: 'platform-v0:domain-html',
			title: 'Moonlight',
			data: { year: 2016 },
		});
	});

	it('retains structured TMDB identity when malformed JSON-LD falls back to OpenGraph', async () => {
		const html = `
			<html>
				<head>
					<link rel="canonical" href="${FILM_URL}" />
					<script type="application/ld+json">{ malformed </script>
					<meta property="og:title" content="Moonlight (2016)" />
					<meta property="og:description" content="A young man searches for his place." />
				</head>
				<body data-tmdb-id="376867" data-tmdb-type="movie"><main class="film-header" data-film-slug="moonlight"></main></body>
			</html>`;
		const { result } = await classifyWithResponses([new Response(html, { status: 200 })]);

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'tmdb:movie:376867',
			title: 'Moonlight',
		});
		expect(result.resolved?.atoms[0]?.sameAs).toEqual([
			FILM_URL,
			'https://letterboxd.com/tmdb/376867',
			'https://www.themoviedb.org/movie/376867',
		]);
	});

	it('keeps untyped numeric page identity provider-local until media kind is known', async () => {
		const html = `<html data-tmdb-id="376867"><head><link rel="canonical" href="${FILM_URL}" /><meta property="og:title" content="Moonlight (2016)" /></head></html>`;
		const { result } = await classifyWithResponses([new Response(html, { status: 200 })]);

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'letterboxd:film:moonlight',
			schemaType: 'Movie',
		});
	});

	it('fails closed when the requested bridge and selected JSON-LD identity conflict', async () => {
		const html = `<script type="application/ld+json">${JSON.stringify({
			'@type': 'Movie',
			name: 'Wrong Film',
			sameAs: ['https://www.themoviedb.org/movie/111'],
		})}</script>`;
		const { result } = await classifyWithResponses([new Response(html, { status: 200 })], {
			input: 'https://letterboxd.com/tmdb/222',
		});

		expect(result.status).toBe('partial');
		expect(result.resolved).toBeUndefined();
		expect(result.classification?.meta.acquisitionOutcome).toEqual({
			reason: 'identity_conflict',
			stage: 'domain-html',
			status: 'unavailable',
			terminal: true,
		});
		expect(result.resolverErrors?.[0]?.message).toContain('identity_conflict');
	});

	it('emits TVSeries and tmdb:tv when the selected node carries explicit TV evidence', async () => {
		const html = `<html data-tmdb-id="12345"><head><link rel="canonical" href="https://letterboxd.com/film/a-series/" /><script type="application/ld+json">${JSON.stringify(
			{
				'@type': 'TVSeries',
				name: 'A Series',
				sameAs: ['https://www.themoviedb.org/tv/12345'],
			}
		)}</script></head></html>`;
		const { result } = await classifyWithResponses([new Response(html, { status: 200 })], {
			input: 'https://letterboxd.com/film/a-series/',
		});

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'tmdb:tv:12345',
			schemaType: 'TVSeries',
			title: 'A Series',
		});
		expect(result.resolved?.atoms[0]?.sameAs).toContain('https://www.themoviedb.org/tv/12345');
	});

	it('returns a typed blocked outcome and no atom after a 403 without refetching', async () => {
		const { result } = await classifyWithResponses([
			new Response('', { status: 403 }),
			new Response('<meta property="og:title" content="Letterboxd" />', { status: 200 }),
		]);

		expect(result.status).toBe('partial');
		expect(result.resolved).toBeUndefined();
		expect(result.classification?.meta.acquisitionOutcome).toEqual({
			reason: 'non_ok_status',
			stage: 'domain-html',
			status: 'unavailable',
			terminal: true,
		});
		expect(result.resolverErrors?.[0]?.message).toContain('retryAfterMs=30000');
	});

	it('rejects a foreign redirect before fetching its destination', async () => {
		const requestedHosts: string[] = [];
		const result = await serverEngine(async (input) => {
			requestedHosts.push(new URL(input).hostname);
			return new Response('', {
				headers: { location: 'https://example.com/evil' },
				status: 302,
			});
		}).classify({
			input: FILM_URL,
			mode: 'server-only',
			classificationSessionId: 'letterboxd-foreign-redirect',
		});

		expect(requestedHosts).toEqual(['letterboxd.com']);
		expect(result.status).toBe('partial');
		expect(result.resolved).toBeUndefined();
		expect(result.resolverErrors?.[0]?.message).toContain('redirect_rejected');
	});

	it('detects a repeated redirect URL without consuming the resolver budget', async () => {
		let fetchCallCount = 0;
		const result = await serverEngine(async () => {
			fetchCallCount += 1;
			return new Response('', { headers: { location: FILM_URL }, status: 302 });
		}).classify({
			input: FILM_URL,
			mode: 'server-only',
			classificationSessionId: 'letterboxd-redirect-loop',
		});

		expect(fetchCallCount).toBe(1);
		expect(result.status).toBe('partial');
		expect(result.resolved).toBeUndefined();
		expect(result.resolverErrors?.[0]?.message).toContain('redirect_exhausted');
	});

	it('treats a bridge 404 as terminal and does not mint the requested identity', async () => {
		const { result, requestedHosts } = await classifyWithResponses(
			[new Response('', { status: 404 })],
			{ input: 'https://letterboxd.com/tmdb/999999' }
		);

		expect(requestedHosts).toEqual(['letterboxd.com']);
		expect(result.status).toBe('partial');
		expect(result.resolved).toBeUndefined();
		expect(result.resolverErrors?.[0]?.message).toContain('unavailable');
	});

	it('treats a decompressed body over the byte limit as terminal', async () => {
		const { result, requestedHosts } = await classifyWithResponses([
			new Response(`<html>${'x'.repeat(1_100_000)}</html>`, { status: 200 }),
		]);

		expect(requestedHosts).toEqual(['letterboxd.com']);
		expect(result.status).toBe('partial');
		expect(result.resolved).toBeUndefined();
		expect(result.resolverErrors?.[0]?.message).toContain('body_limit');
	});

	it('honors the shared host cooldown after a 403 failure', async () => {
		let fetchCallCount = 0;
		const fetch = async () => {
			fetchCallCount += 1;
			return new Response('', { status: 403 });
		};
		const engine = serverEngine(fetch);
		let lastResult: Awaited<ReturnType<typeof engine.classify>> | undefined;

		for (const slug of ['one', 'two', 'three']) {
			lastResult = await engine.classify({
				input: `https://letterboxd.com/film/${slug}/`,
				mode: 'server-only',
				classificationSessionId: `letterboxd-breaker-${slug}`,
			});
		}

		expect(fetchCallCount).toBe(1);
		expect(lastResult?.resolverErrors?.[0]?.message).toContain('circuit_open');
	});
});

function clientEngine() {
	return createClientEngine({
		onClassifierError: () => undefined,
		plugins: [createTypeProfilesPlugin(), createLetterboxdPlugin()],
	});
}

function serverEngine(fetch: (input: string, init?: RequestInit) => Promise<Response>) {
	return createServerEngine({
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createLetterboxdPlugin({
				adapters: {
					domainHtml: createLetterboxdDomainHtmlAdapter({
						fetch,
						resolveHostname: resolvePublicTestHostname,
					}),
					openGraph: createLetterboxdOpenGraphAdapter({
						fetch,
						resolveHostname: resolvePublicTestHostname,
					}),
				},
			}),
		],
	});
}

async function classifyWithResponses(responses: Response[], options: { input?: string } = {}) {
	const requestedHosts: string[] = [];
	let responseIndex = 0;
	const result = await serverEngine(async (input) => {
		const host = new URL(input).hostname;
		requestedHosts.push(host);
		expect(
			host === 'letterboxd.com' || host.endsWith('.letterboxd.com') || host === 'a.ltrbxd.com'
		).toBe(true);
		const response = responses[responseIndex];
		responseIndex += 1;
		return response ?? new Response('', { status: 500 });
	}).classify({
		input: options.input ?? FILM_URL,
		mode: 'server-only',
		classificationSessionId: `letterboxd-fixture-${responses.length}-${Date.now()}`,
	});

	return { requestedHosts, result };
}
