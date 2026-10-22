import { beforeEach, describe, expect, it } from 'vitest';
import {
	executeLetterboxdHostRequest,
	getLetterboxdHostCircuitSnapshot,
	LETTERBOXD_MINIMUM_SPACING_MS,
	LetterboxdCooldownError,
	resetLetterboxdHostPolicyForTests,
} from './letterboxd';
import { parseLetterboxdPage } from './letterboxd-page';

describe('Letterboxd page identity', () => {
	it('R2-01 ignores unrelated page-data identity outside the primary work', () => {
		const page = parseLetterboxdPage(
			`<html><head>
				<link rel="canonical" href="https://letterboxd.com/film/legitimate/" />
				<script type="application/ld+json">${JSON.stringify({
					'@type': 'Movie',
					name: 'Legitimate',
				})}</script>
			</head><body><aside data-tmdb-id="666" data-tmdb-type="movie">Related</aside></body></html>`,
			'https://letterboxd.com/film/legitimate/'
		);

		expect(page.title).toBe('Legitimate');
		expect(page.identity).toEqual({ status: 'provider_local', evidence: [] });
	});

	it('R2-02 selects the sole JSON-LD candidate agreeing with the requested bridge', () => {
		const page = parseLetterboxdPage(
			`<script type="application/ld+json">${JSON.stringify({
				'@graph': [
					{
						'@type': 'Movie',
						name: 'Injected',
						sameAs: ['https://www.themoviedb.org/movie/111'],
					},
					{
						'@type': 'Movie',
						name: 'Requested',
						sameAs: ['https://www.themoviedb.org/movie/222'],
					},
				],
			})}</script>`,
			'https://letterboxd.com/tmdb/222'
		);

		expect(page.title).toBe('Requested');
		expect(page.identity).toMatchObject({ status: 'resolved', kind: 'movie', tmdbId: '222' });
	});

	it('R2-02 fails closed when multiple JSON-LD candidates agree', () => {
		const candidate = {
			'@type': 'Movie',
			name: 'Duplicate',
			sameAs: ['https://www.themoviedb.org/movie/222'],
		};
		const page = parseLetterboxdPage(
			`<script type="application/ld+json">${JSON.stringify({ '@graph': [candidate, candidate] })}</script>`,
			'https://letterboxd.com/tmdb/222'
		);

		expect(page.identity.status).toBe('identity_conflict');
		expect(page.title).toBeUndefined();
	});

	it('R2-02 fails closed when no JSON-LD candidate agrees', () => {
		const page = parseLetterboxdPage(
			`<script type="application/ld+json">${JSON.stringify({
				'@graph': [
					{
						'@type': 'Movie',
						name: 'First',
						sameAs: ['https://www.themoviedb.org/movie/111'],
					},
					{
						'@type': 'Movie',
						name: 'Second',
						sameAs: ['https://www.themoviedb.org/movie/333'],
					},
				],
			})}</script>`,
			'https://letterboxd.com/tmdb/222'
		);

		expect(page.identity.status).toBe('identity_conflict');
		expect(page.title).toBeUndefined();
	});

	it('R2-03 does not infer TMDB media kind from a JSON-LD schema type', () => {
		const page = parseLetterboxdPage(
			`<script type="application/ld+json">${JSON.stringify({
				'@type': 'Movie',
				name: 'Film',
			})}</script>`,
			'https://letterboxd.com/tmdb/123'
		);

		expect(page.identity).toEqual({
			status: 'provider_local',
			evidence: [{ id: '123', source: 'request_bridge' }],
		});
		expect(page.identity.status === 'resolved' ? page.identity.kind : undefined).toBeUndefined();
	});

	it('R3-01 ignores forged TMDB identity on a descendant primary-work comment', () => {
		const page = parseLetterboxdPage(
			`<html><head>
				<link rel="canonical" href="https://letterboxd.com/film/legitimate/" />
				<script type="application/ld+json">${JSON.stringify({
					'@type': 'Movie',
					name: 'Legitimate',
				})}</script>
			</head><body><div class="comment-body primary-work" data-tmdb-id="666" data-tmdb-type="movie"><a href="https://letterboxd.com/film/legitimate/">Legitimate</a></div></body></html>`,
			'https://letterboxd.com/film/legitimate/'
		);

		expect(page.identity).toEqual({ status: 'provider_local', evidence: [] });
		expect(page.identity.status === 'resolved' ? page.identity.tmdbId : undefined).toBeUndefined();
	});

	it('R3-01 accepts typed TMDB identity from body when JSON-LD agrees', () => {
		const page = parseLetterboxdPage(
			`<html><head><link rel="canonical" href="https://letterboxd.com/film/legitimate/" />
				<script type="application/ld+json">${JSON.stringify({
					'@type': 'Movie',
					name: 'Legitimate',
					sameAs: ['https://www.themoviedb.org/movie/123'],
				})}</script></head><body class="film" data-tmdb-id="123" data-tmdb-type="movie"></body></html>`,
			'https://letterboxd.com/film/legitimate/'
		);

		expect(page.identity).toMatchObject({ status: 'resolved', kind: 'movie', tmdbId: '123' });
	});

	it('R3-01 fails closed when body identity disagrees with JSON-LD', () => {
		const page = parseLetterboxdPage(
			`<html><head><link rel="canonical" href="https://letterboxd.com/film/legitimate/" />
				<script type="application/ld+json">${JSON.stringify({
					'@type': 'Movie',
					name: 'Legitimate',
					sameAs: ['https://www.themoviedb.org/movie/456'],
				})}</script></head><body data-tmdb-id="123" data-tmdb-type="movie"></body></html>`,
			'https://letterboxd.com/film/legitimate/'
		);

		expect(page.identity.status).toBe('identity_conflict');
	});

	it('R3-01 keeps body identity untyped when its TMDB type is missing or unknown', () => {
		for (const typeAttribute of ['', ' data-tmdb-type="person"']) {
			const page = parseLetterboxdPage(
				`<html><head><link rel="canonical" href="https://letterboxd.com/film/legitimate/" />
					<script type="application/ld+json">${JSON.stringify({
						'@type': 'Movie',
						name: 'Legitimate',
					})}</script></head><body data-tmdb-id="123"${typeAttribute}></body></html>`,
				'https://letterboxd.com/film/legitimate/'
			);

			expect(page.identity).toEqual({ status: 'provider_local', evidence: [] });
		}
	});
});

describe('Letterboxd document-root page data (adv-R4)', () => {
	const canonical = '<link rel="canonical" href="https://letterboxd.com/film/legitimate/" />';
	const movieJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@type': 'Movie',
		name: 'Legitimate',
	})}</script>`;
	const parse = (html: string) =>
		parseLetterboxdPage(html, 'https://letterboxd.com/film/legitimate/');

	it('R4-01 has no <html> fallback: a forged root in head-level text never mints', () => {
		const forged = '<html data-tmdb-id="666" data-tmdb-type="movie">';
		for (const html of [
			`<script>var s = '${forged}';</script><html><head>${canonical}${movieJsonLd}</head></html>`,
			`<!-- ${forged} --><html><head>${canonical}${movieJsonLd}</head></html>`,
			`<html><head>${canonical}${movieJsonLd}<meta content="${forged.replaceAll('"', '&quot;')}"></head></html>`,
			`<html><head>${canonical}${movieJsonLd}</head><textarea>${forged}</textarea></html>`,
		]) {
			expect(parse(html).identity).toEqual({ status: 'provider_local', evidence: [] });
		}
	});

	it('R4-02 ignores a forged <body-data> tag before the real body', () => {
		const page = parse(
			`<html><head>${canonical}${movieJsonLd}</head><body-data data-tmdb-id="666" data-tmdb-type="movie"></body-data><body data-tmdb-id="123" data-tmdb-type="movie"></body></html>`
		);

		expect(page.identity).toMatchObject({ status: 'resolved', kind: 'movie', tmdbId: '123' });
	});

	it('R4-03 follows HTML attribute semantics on the body tag', () => {
		const cases: Array<[string, string | undefined]> = [
			['data-tmdb-id="123" data-tmdb-type="movie" data-tmdb-id="666"', '123'],
			['data-tmdb-id=123 data-tmdb-type=movie', '123'],
			["data-tmdb-id='123'\n\tDATA-TMDB-TYPE='movie'", '123'],
			['data-tmdb-id="&#49;23" data-tmdb-type="&#x6d;ovie"', '123'],
			['data-tmdb-id="0123" data-tmdb-type="movie"', undefined],
			['data-tmdb-id="12a" data-tmdb-type="movie"', undefined],
			['data-tmdb-id=" 123 " data-tmdb-type="movie"', undefined],
		];
		for (const [attributes, expected] of cases) {
			const page = parse(
				`<html><head>${canonical}${movieJsonLd}</head><body ${attributes}></body></html>`
			);
			expect(page.identity.status === 'resolved' ? page.identity.tmdbId : undefined).toBe(expected);
		}
	});
});

describe('Letterboxd host policy', () => {
	beforeEach(() => resetLetterboxdHostPolicyForTests());

	it('spaces sequential request starts by at least 1,250 ms with a fake clock', async () => {
		let nowMs = 0;
		const starts: number[] = [];
		const options = {
			now: () => nowMs,
			sleep: async (delayMs: number) => {
				nowMs += delayMs;
			},
		};

		for (let index = 0; index < 3; index += 1) {
			await executeLetterboxdHostRequest(
				'letterboxd.com',
				async () => {
					starts.push(nowMs);
				},
				options
			);
		}

		expect(starts).toEqual([0, 1_250, 2_500]);
	});

	it('serializes concurrent request starts process-wide across www and apex hosts', async () => {
		let nowMs = 0;
		const starts: number[] = [];
		const options = {
			now: () => nowMs,
			sleep: async (delayMs: number) => {
				nowMs += delayMs;
			},
		};

		await Promise.all(
			['letterboxd.com', 'www.letterboxd.com', 'letterboxd.com'].map((hostname) =>
				executeLetterboxdHostRequest(
					hostname,
					async () => {
						starts.push(nowMs);
					},
					options
				)
			)
		);

		expect(starts).toHaveLength(3);
		for (let index = 1; index < starts.length; index += 1) {
			expect((starts[index] ?? 0) - (starts[index - 1] ?? 0)).toBeGreaterThanOrEqual(
				LETTERBOXD_MINIMUM_SPACING_MS
			);
		}
	});

	it('honors Retry-After cooldowns before admitting another request', async () => {
		let nowMs = 10_000;
		let requestCount = 0;
		const blocked = Object.assign(new Error('HTTP 403'), {
			reason: 'http_error',
			retryAfterMs: 30_000,
			status: 403,
		});

		await expect(
			executeLetterboxdHostRequest(
				'letterboxd.com',
				async () => {
					requestCount += 1;
					throw blocked;
				},
				{ now: () => nowMs, sleep: async () => undefined }
			)
		).rejects.toBe(blocked);

		await expect(
			executeLetterboxdHostRequest(
				'letterboxd.com',
				async () => {
					requestCount += 1;
				},
				{ now: () => nowMs, sleep: async () => undefined }
			)
		).rejects.toBeInstanceOf(LetterboxdCooldownError);
		expect(requestCount).toBe(1);

		nowMs += 30_000;
		await executeLetterboxdHostRequest(
			'letterboxd.com',
			async () => {
				requestCount += 1;
			},
			{ now: () => nowMs, sleep: async () => undefined }
		);
		expect(requestCount).toBe(2);
	});

	it('R2-04 stores only a bounded cooldown for an excessive upstream hint', async () => {
		let nowMs = 1_000;
		let requestCount = 0;
		const blocked = Object.assign(new Error('HTTP 403'), {
			retryAfterMs: 99_999_999_000,
			status: 403,
		});

		await expect(
			executeLetterboxdHostRequest(
				'letterboxd.com',
				async () => {
					requestCount += 1;
					throw blocked;
				},
				{ now: () => nowMs, sleep: async () => undefined }
			)
		).rejects.toBe(blocked);

		await expect(
			executeLetterboxdHostRequest('www.letterboxd.com', async () => undefined, {
				now: () => nowMs,
				sleep: async () => undefined,
			})
		).rejects.toMatchObject({ retryAfterMs: 30_000 });

		nowMs += 30_000;
		await executeLetterboxdHostRequest(
			'www.letterboxd.com',
			async () => {
				requestCount += 1;
			},
			{ now: () => nowMs, sleep: async () => undefined }
		);
		expect(requestCount).toBe(2);
	});

	it('opens the breaker after three recordable failures separated by cooldown expiry', async () => {
		let nowMs = 0;
		const failure = Object.assign(new Error('HTTP 503'), { status: 503 });
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await expect(
				executeLetterboxdHostRequest(
					'letterboxd.com',
					async () => {
						throw failure;
					},
					{
						now: () => nowMs,
						sleep: async (delayMs) => {
							nowMs += delayMs;
						},
					}
				)
			).rejects.toBe(failure);
			nowMs += 30_000;
		}

		expect(getLetterboxdHostCircuitSnapshot('letterboxd.com')).toMatchObject({
			failures: 3,
			state: 'open',
		});
	});

	it('R2-05 removes an aborted waiter without consuming the next admission slot', async () => {
		let nowMs = 0;
		const starts: string[] = [];
		const sleepers: Array<() => void> = [];
		const sleep = async (delayMs: number) => {
			const targetMs = nowMs + delayMs;
			await new Promise<void>((resolve) => sleepers.push(resolve));
			nowMs = Math.max(nowMs, targetMs);
		};
		const options = { now: () => nowMs, sleep };

		await executeLetterboxdHostRequest(
			'letterboxd.com',
			async () => starts.push(`first@${nowMs}`),
			options
		);

		const controller = new AbortController();
		const second = executeLetterboxdHostRequest(
			'letterboxd.com',
			async () => starts.push(`cancelled@${nowMs}`),
			{ ...options, signal: controller.signal }
		);
		const third = executeLetterboxdHostRequest(
			'letterboxd.com',
			async () => starts.push(`third@${nowMs}`),
			options
		);

		for (let index = 0; index < 5 && sleepers.length === 0; index += 1) {
			await Promise.resolve();
		}
		controller.abort(new Error('cancelled before admission'));
		for (let index = 0; index < 5 && sleepers.length < 2; index += 1) {
			await Promise.resolve();
		}
		for (const release of sleepers) {
			release();
		}

		const [secondResult] = await Promise.allSettled([second, third]);
		expect(secondResult?.status).toBe('rejected');
		expect(starts).toEqual(['first@0', 'third@1250']);
	});
});
