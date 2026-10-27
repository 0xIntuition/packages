import { describe, expect, test } from 'bun:test';
import { z } from 'zod/v4';
import { ProviderHttpError } from './http';
import {
	classifyWikimediaError,
	describeProviderFetchFailure,
	isWikimediaMiss,
	rejectMediaWikiActionApiError,
	WIKIMEDIA_STATUS_OUTCOMES,
	withoutMediaWikiApiError,
} from './provider-fetch';

const http = (status: number, errorClass?: string) =>
	new ProviderHttpError({ status, ...(errorClass ? { errorClass } : {}) });
const response = (headers: Record<string, string>) => ({ headers: new Headers(headers) });

describe('Wikimedia status semantics (shared by enrichment and classification)', () => {
	test('the table is exactly 404 miss, 403 auth_failed, 429 rate_limited', () => {
		expect(WIKIMEDIA_STATUS_OUTCOMES).toEqual({
			404: 'miss',
			403: 'auth_failed',
			429: 'rate_limited',
		});
	});

	test('only a plain 404 is a miss; guard errors that carry 404-like fixed statuses are not', () => {
		expect(isWikimediaMiss(http(404))).toBe(true);
		for (const status of [400, 403, 429, 500, 503])
			expect(isWikimediaMiss(http(status))).toBe(false);
		expect(isWikimediaMiss(http(502, 'invalid_json'))).toBe(false);
		expect(isWikimediaMiss(http(413, 'response_too_large'))).toBe(false);
		expect(isWikimediaMiss(new z.ZodError([]))).toBe(false);
		expect(isWikimediaMiss(new Error('boom'))).toBe(false);
	});

	test('outcomes: 404 miss, 403 auth_failed, 429 rate_limited, 500 upstream_5xx', () => {
		expect(classifyWikimediaError(http(404))).toEqual({ outcome: 'miss', reason: 'none' });
		expect(classifyWikimediaError(http(403))).toEqual({ outcome: 'error', reason: 'auth_failed' });
		expect(classifyWikimediaError(http(429))).toEqual({ outcome: 'error', reason: 'rate_limited' });
		expect(classifyWikimediaError(http(500))).toEqual({ outcome: 'error', reason: 'upstream_5xx' });
	});
});

describe('MediaWiki action API errors', () => {
	test('maxlag becomes a 429 carrying Retry-After', () => {
		const error = rejectMediaWikiActionApiError(
			response({ 'mediawiki-api-error': 'maxlag', 'retry-after': '5' }) as never
		) as ProviderHttpError;
		expect(error).toBeInstanceOf(ProviderHttpError);
		expect(error.status).toBe(429);
		expect(error.retryAfterMs).toBe(5_000);
	});

	test.each<[string, 'rate_limited' | 'upstream_5xx' | 'invalid_response', number]>([
		['maxlag', 'rate_limited', 429],
		['ratelimited', 'rate_limited', 429],
		['readonly', 'upstream_5xx', 503],
		['internal_api_error_DBQueryError', 'upstream_5xx', 503],
		['badvalue', 'invalid_response', 502],
		['missingparam', 'invalid_response', 502],
		['toomanyvalues', 'invalid_response', 502],
	])('header code %s maps to %s (status %d), the same as the {error} body without the header', (code, reason, status) => {
		const fromHeader = rejectMediaWikiActionApiError(
			response({ 'mediawiki-api-error': code, 'retry-after': '5' }) as never
		) as ProviderHttpError;
		expect(fromHeader.status).toBe(status);
		expect(classifyWikimediaError(fromHeader)).toEqual({ outcome: 'error', reason });
		// The throttles carry the server's Retry-After when it is given.
		expect(fromHeader.retryAfterMs).toBe(status === 429 ? 5_000 : undefined);
		const schema = withoutMediaWikiApiError(z.object({ ok: z.boolean() }).loose());
		let fromBody: unknown;
		try {
			schema.parse({ error: { code } });
		} catch (error) {
			fromBody = error;
		}
		expect(fromBody).toBeInstanceOf(ProviderHttpError);
		expect(classifyWikimediaError(fromBody)).toEqual({ outcome: 'error', reason });
		expect((fromBody as ProviderHttpError).status).toBe(status);
	});

	test('an invalid_response API error is not an invalid_json parse failure', () => {
		const error = rejectMediaWikiActionApiError(
			response({ 'mediawiki-api-error': 'badvalue' }) as never
		) as ProviderHttpError;
		expect(error.errorClass).toBe('api_error');
		expect(describeProviderFetchFailure(error).kind).toBe('parse_failure');
	});

	test('a body error without a usable code is an invalid_response', () => {
		const schema = withoutMediaWikiApiError(z.object({ ok: z.boolean() }).loose());
		for (const body of [{ error: {} }, { error: 'x' }, { error: { code: 5 } }]) {
			try {
				schema.parse(body);
				throw new Error('expected a throw');
			} catch (error) {
				expect(classifyWikimediaError(error)).toEqual({
					outcome: 'error',
					reason: 'invalid_response',
				});
			}
		}
	});

	test('a response without the header is left alone', () => {
		expect(rejectMediaWikiActionApiError(response({}) as never)).toBeUndefined();
	});

	test('an {error} body without the header fails as the same api_error; other bodies pass through', () => {
		const schema = withoutMediaWikiApiError(
			z.object({ search: z.array(z.object({ id: z.string() })).optional() }).loose()
		);
		expect(() => schema.parse({ error: { code: 'x' } })).toThrow(ProviderHttpError);
		try {
			schema.parse({ error: { code: 'x' } });
		} catch (error) {
			expect((error as ProviderHttpError).errorClass).toBe('api_error');
		}
		expect(schema.parse({ search: [] })).toEqual({ search: [] });
		expect(schema.parse({})).toEqual({});
	});

	test('a plain (stripping) z.object schema still refuses an {error} body instead of returning {}', () => {
		const schema = withoutMediaWikiApiError(
			z.object({ search: z.array(z.object({ id: z.string() })).optional() })
		);
		let thrown: unknown;
		try {
			schema.parse({ error: { code: 'x' } });
		} catch (error) {
			thrown = error;
		}
		expect(thrown).toBeInstanceOf(ProviderHttpError);
		expect((thrown as ProviderHttpError).errorClass).toBe('api_error');
		expect(schema.parse({ search: [{ id: 'Q1' }], extra: 1 })).toEqual({ search: [{ id: 'Q1' }] });
	});
});
