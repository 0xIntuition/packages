import { describe, expect, it } from 'bun:test';

import { createEnrichmentEngine } from '../src/engine';
import {
	createPinAwareFetch,
	type FetchLike,
	fetchJson,
	fetchText,
	ProviderHttpError,
	type ProviderHttpOptions,
	parseRetryAfterMs,
} from '../src/plugins/providers/__shared__/http';
import { createMockPlugin, createMockRequest } from '../src/testing';
import type { PluginExecutionError } from '../src/types';

describe('bounded Retry-After policy', () => {
	it('R2-04 defaults invalid or excessive hints and accepts a sane duration', () => {
		const nowMs = Date.parse('2026-08-27T00:00:00.000Z');

		expect(parseRetryAfterMs('99999999', nowMs)).toBe(30_000);
		expect(parseRetryAfterMs('Wed, 26 Aug 2026 00:00:00 GMT', nowMs)).toBe(30_000);
		expect(parseRetryAfterMs('-5', nowMs)).toBe(30_000);
		expect(parseRetryAfterMs('abc', nowMs)).toBe(30_000);
		expect(parseRetryAfterMs('120', nowMs)).toBe(120_000);
	});
});

const publicDns = { resolve: async () => [{ address: '8.8.8.8', family: 4 as const }] };

type HttpErrorFixture = {
	body?: string;
	headers?: HeadersInit;
	status: number;
	url?: string;
	options?: ProviderHttpOptions;
};

async function captureHttpError(fixture: HttpErrorFixture): Promise<ProviderHttpError> {
	const fetcher: FetchLike = () =>
		Promise.resolve(
			new Response(fixture.body ?? '', {
				status: fixture.status,
				headers: fixture.headers,
			})
		);

	try {
		await fetchJson(
			createPinAwareFetch(fetcher),
			fixture.url ?? 'https://provider.example/resource',
			undefined,
			{ ...publicDns, ...fixture.options }
		);
	} catch (error) {
		expect(error).toBeInstanceOf(ProviderHttpError);
		return error as ProviderHttpError;
	}

	throw new Error('Expected fetchJson() to throw ProviderHttpError.');
}

async function classify(error: Error): Promise<PluginExecutionError> {
	const engine = createEnrichmentEngine();
	engine.registerPlugin(
		createMockPlugin({
			id: 'failing-provider',
			mockError: error,
		})
	);

	const result = await engine.enrich(createMockRequest());
	const pluginError = result.errors[0];
	if (!pluginError) {
		throw new Error('Expected enrichment engine to return a plugin error.');
	}
	return pluginError;
}

describe('provider HTTP errors', () => {
	it('rejects env-derived embargoed hosts on the initial URL and every redirect', async () => {
		const prior = process.env.TMDB_URL;
		process.env.TMDB_URL = 'https://api.themoviedb.org/3/movie/550';
		let fetchCallCount = 0;
		const fetcher: FetchLike = async () => {
			fetchCallCount += 1;
			return new Response('', {
				headers: { location: process.env.TMDB_URL as string },
				status: 302,
			});
		};

		try {
			await expect(
				fetchJson(createPinAwareFetch(fetcher), process.env.TMDB_URL, undefined, publicDns)
			).rejects.toMatchObject({
				errorClass: 'embargoed_host',
			});
			await expect(
				fetchJson(
					createPinAwareFetch(fetcher),
					'https://provider.example/start',
					undefined,
					publicDns
				)
			).rejects.toMatchObject({
				errorClass: 'embargoed_host',
			});
			expect(fetchCallCount).toBe(1);
		} finally {
			if (prior === undefined) delete process.env.TMDB_URL;
			else process.env.TMDB_URL = prior;
		}
	});

	it('rejects DNS-root-dot embargoed hosts on the initial URL and on redirects (adv-R4 F4-1)', async () => {
		let fetchCallCount = 0;
		const dottedTargets = [
			'https://api.themoviedb.org./3/movie/550',
			'https://API.TheMovieDB.org../3/movie/550',
			'https://image.tmdb.org./t/p/w500/poster.jpg',
		];
		const fetcher: FetchLike = async () => {
			fetchCallCount += 1;
			return new Response('', {
				headers: { location: dottedTargets[0] as string },
				status: 302,
			});
		};

		for (const target of dottedTargets) {
			await expect(
				fetchJson(createPinAwareFetch(fetcher), target, undefined, publicDns)
			).rejects.toMatchObject({
				errorClass: 'embargoed_host',
			});
		}
		expect(fetchCallCount).toBe(0);

		await expect(
			fetchJson(
				createPinAwareFetch(fetcher),
				'https://provider.example/start',
				undefined,
				publicDns
			)
		).rejects.toMatchObject({
			errorClass: 'embargoed_host',
		});
		expect(fetchCallCount).toBe(1);

		await expect(
			fetchJson(
				createPinAwareFetch(async () => new Response('{}', { status: 200 })),
				'https://nottmdb.org./x',
				undefined,
				publicDns
			)
		).resolves.toBeDefined();
	});

	it('classifies 429 with Retry-After seconds and preserves typed evidence', async () => {
		const error = await captureHttpError({
			status: 429,
			headers: { 'Retry-After': '12' },
			body: '{"message":"slow down"}',
		});
		const pluginError = await classify(error);

		expect(error.message).toBe('HTTP 429 from provider');
		expect(error.retryAfterMs).toBe(12_000);
		expect(pluginError).toEqual({
			pluginId: 'failing-provider',
			code: 'rate_limited',
			message: 'HTTP 429 from provider',
			retriable: true,
			details: {
				status: 429,
				retryAfterMs: 12_000,
				errorClass: 'provider_http_error',
			},
		});
	});

	it('parses 429 Retry-After http-date form', async () => {
		const retryAt = new Date(Date.now() + 60_000).toUTCString();
		const error = await captureHttpError({
			status: 429,
			headers: { 'Retry-After': retryAt },
		});
		const pluginError = await classify(error);

		expect(error.retryAfterMs).toBeGreaterThanOrEqual(58_000);
		expect(error.retryAfterMs).toBeLessThanOrEqual(60_000);
		expect(pluginError.code).toBe('rate_limited');
		expect(pluginError.details?.retryAfterMs).toBe(error.retryAfterMs);
	});

	it('classifies 429 without Retry-After and leaves retry evidence absent', async () => {
		const error = await captureHttpError({ status: 429 });
		const pluginError = await classify(error);

		expect(error.retryAfterMs).toBeUndefined();
		expect(pluginError.code).toBe('rate_limited');
		expect(pluginError.retriable).toBe(true);
		expect(pluginError.details?.retryAfterMs).toBeUndefined();
	});

	it('classifies typed 500 responses as retriable upstream errors', async () => {
		const pluginError = await classify(
			await captureHttpError({ status: 500, body: 'provider failed' })
		);

		expect(pluginError.code).toBe('upstream_error');
		expect(pluginError.retriable).toBe(true);
		expect(pluginError.details).toMatchObject({ status: 500 });
	});

	it('S2: a typed 503 provider_http_error stays a retriable upstream_error, never rate_limited', async () => {
		const error = await captureHttpError({
			status: 503,
			body: 'down',
			headers: { 'retry-after': '30' },
		});
		expect(error.errorClass).toBe('provider_http_error');
		const pluginError = await classify(error);

		expect(pluginError.code).toBe('upstream_error');
		expect(pluginError.retriable).toBe(true);
		expect(pluginError.details).toMatchObject({ status: 503 });
	});

	it('statusClasses gives a status its class at birth: retriable rate_limited with Retry-After kept', async () => {
		const error = await captureHttpError({
			status: 503,
			body: 'busy',
			headers: { 'retry-after': '30' },
			options: { statusClasses: { 503: 'rate_limited' } },
		});
		expect(error.errorClass).toBe('rate_limited');
		expect(error.status).toBe(503);
		expect(error.retryAfterMs).toBe(30_000);
		const pluginError = await classify(error);

		expect(pluginError.code).toBe('rate_limited');
		expect(pluginError.retriable).toBe(true);
		expect(pluginError.details).toMatchObject({
			status: 503,
			retryAfterMs: 30_000,
			errorClass: 'rate_limited',
		});
	});

	it('statusClasses leaves other statuses alone', async () => {
		const error = await captureHttpError({
			status: 500,
			options: { statusClasses: { 503: 'rate_limited' } },
		});
		expect(error.errorClass).toBe('provider_http_error');
	});

	it('classifies typed 404 responses as non-retriable upstream errors', async () => {
		const pluginError = await classify(await captureHttpError({ status: 404, body: 'missing' }));

		expect(pluginError.code).toBe('upstream_error');
		expect(pluginError.retriable).toBe(false);
		expect(pluginError.details).toMatchObject({ status: 404 });
	});

	it('keeps the 429 substring fallback for non-typed errors', async () => {
		const pluginError = await classify(new Error('provider returned status 429'));

		expect(pluginError.code).toBe('rate_limited');
		expect(pluginError.retriable).toBe(true);
		expect(pluginError.details).toBeUndefined();
	});

	it('keeps the default taxonomy for non-typed errors without known substrings', async () => {
		const pluginError = await classify(new Error('API unavailable'));

		expect(pluginError.code).toBe('internal_error');
		expect(pluginError.retriable).toBe(false);
		expect(pluginError.details).toBeUndefined();
	});

	it('gives typed status evidence precedence over rate-limit message substrings', async () => {
		const error = await captureHttpError({
			status: 404,
			url: 'https://provider.example/429-rate-limit',
			body: 'rate limit response',
		});
		const pluginError = await classify(error);

		expect(error.message).not.toContain('429-rate-limit');
		expect(pluginError.code).toBe('upstream_error');
		expect(pluginError.retriable).toBe(false);
		expect(pluginError.details).toMatchObject({ status: 404 });
	});

	it('drops body excerpts and request URLs', async () => {
		const secretBody = [
			'authorization: Bearer header-secret',
			'{"access_token":"json-secret","message":"failed"}',
			`api_key=form-secret&padding=${'x'.repeat(1_000)}`,
		].join('\n');
		const url = 'https://provider.example/resource?api_key=url-secret&safe=value';
		const fetcher: FetchLike = () => Promise.resolve(new Response(secretBody, { status: 500 }));

		let error: ProviderHttpError | undefined;
		try {
			await fetchText(createPinAwareFetch(fetcher), url, undefined, publicDns);
		} catch (caught) {
			expect(caught).toBeInstanceOf(ProviderHttpError);
			error = caught as ProviderHttpError;
		}

		expect(error).toBeDefined();
		expect(error).not.toHaveProperty('bodyExcerpt');
		expect(error).not.toHaveProperty('requestUrl');
		expect(error?.message).not.toContain('url-secret');
	});
});
