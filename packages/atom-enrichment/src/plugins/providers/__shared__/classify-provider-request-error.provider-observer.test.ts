import { describe, expect, it } from 'bun:test';
import type { RequestOutcome } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { z } from 'zod/v4';
import { ProviderHttpError } from './http';
import {
	classifyProviderRequestError,
	classifyTransportError,
	providerErrorCode,
} from './provider-request-observer';

const error = (reason: RequestOutcome['reason']): RequestOutcome => ({ outcome: 'error', reason });
const miss: RequestOutcome = { outcome: 'miss', reason: 'none' };
const http = (status: number, errorClass?: string) =>
	new ProviderHttpError({ status, ...(errorClass ? { errorClass } : {}) });

describe('classifyProviderRequestError', () => {
	const options = { statusOutcomes: { 404: 'miss' } as const };

	it('maps a miss status to a miss and any other status by range', () => {
		expect(classifyProviderRequestError(http(404), options)).toEqual(miss);
		expect(classifyProviderRequestError(http(429), options)).toEqual(error('rate_limited'));
		expect(classifyProviderRequestError(http(503), options)).toEqual(error('upstream_5xx'));
		expect(classifyProviderRequestError(http(403), options)).toEqual(error('http_4xx'));
	});

	it('pins the 4xx/5xx range edges', () => {
		for (const [status, reason] of [
			[400, 'http_4xx'],
			[499, 'http_4xx'],
			[500, 'upstream_5xx'],
			[599, 'upstream_5xx'],
		] as const) {
			expect(classifyProviderRequestError(http(status), options)).toEqual(error(reason));
		}
	});

	it('takes the outcome of a status from the caller: 410 is a miss only when declared', () => {
		expect(classifyProviderRequestError(http(410), options)).toEqual(error('http_4xx'));
		expect(
			classifyProviderRequestError(http(410), { statusOutcomes: { 404: 'miss', 410: 'miss' } })
		).toEqual(miss);
		expect(classifyProviderRequestError(http(404), { statusOutcomes: {} })).toEqual(
			error('http_4xx')
		);
	});

	it('maps a declared status to its reason, including a rate-limit the generic range misses', () => {
		const musicBrainz = {
			statusOutcomes: { 503: 'rate_limited', 429: 'rate_limited', 403: 'auth_failed', 404: 'miss' },
		} as const;
		expect(classifyProviderRequestError(http(503), musicBrainz)).toEqual(error('rate_limited'));
		expect(classifyProviderRequestError(http(429), musicBrainz)).toEqual(error('rate_limited'));
		expect(classifyProviderRequestError(http(403), musicBrainz)).toEqual(error('auth_failed'));
		expect(classifyProviderRequestError(http(404), musicBrainz)).toEqual(miss);
		// Undeclared statuses keep the generic mapping.
		expect(classifyProviderRequestError(http(502), musicBrainz)).toEqual(error('upstream_5xx'));
		expect(classifyProviderRequestError(http(401), musicBrainz)).toEqual(error('http_4xx'));
		// Without the declaration a 503 is a plain 5xx and a 401 a plain 4xx.
		expect(classifyProviderRequestError(http(503), options)).toEqual(error('upstream_5xx'));
	});

	it('does not read prototype keys as statuses', () => {
		expect(
			classifyProviderRequestError(http(404), { statusOutcomes: Object.create({ 404: 'miss' }) })
		).toEqual(error('http_4xx'));
	});

	it('maps redirect and guard classes by kind, not by their status', () => {
		for (const [errorClass, status, reason] of [
			['redirect_exhausted', 302, 'invalid_response'],
			['redirect_rejected', 302, 'invalid_response'],
			['target_rejected', 400, 'blocked'],
			['response_too_large', 413, 'invalid_response'],
			['embargoed_host', 451, 'blocked'],
			['invalid_json', 502, 'invalid_response'],
		] as const) {
			expect(classifyProviderRequestError(http(status, errorClass), options)).toEqual(
				error(reason)
			);
		}
	});

	it('never lets a declared status reinterpret a guard error that carries it', () => {
		// A provider that lists 400 as a miss must not count an SSRF rejection (400) as one;
		// likewise 413, 451 and 502 mapped to anything.
		const greedy = {
			statusOutcomes: { 400: 'miss', 413: 'miss', 451: 'miss', 502: 'rate_limited', 302: 'miss' },
		} as const;
		expect(classifyProviderRequestError(http(400, 'target_rejected'), greedy)).toEqual(
			error('blocked')
		);
		expect(classifyProviderRequestError(http(413, 'response_too_large'), greedy)).toEqual(
			error('invalid_response')
		);
		expect(classifyProviderRequestError(http(451, 'embargoed_host'), greedy)).toEqual(
			error('blocked')
		);
		expect(classifyProviderRequestError(http(502, 'invalid_json'), greedy)).toEqual(
			error('invalid_response')
		);
		expect(classifyProviderRequestError(http(302, 'redirect_rejected'), greedy)).toEqual(
			error('invalid_response')
		);
		// The plain 400 of the same provider is still its declared miss.
		expect(classifyProviderRequestError(http(400), greedy)).toEqual(miss);
	});

	it('maps schema and JSON failures to invalid_response', () => {
		const zodError = (() => {
			try {
				z.string().parse(1);
			} catch (caught) {
				return caught;
			}
		})();
		expect(classifyProviderRequestError(zodError, options)).toEqual(error('invalid_response'));
		expect(classifyProviderRequestError(new SyntaxError('bad json'), options)).toEqual(
			error('invalid_response')
		);
	});

	it('maps timeouts and transport faults, and everything else to other', () => {
		expect(
			classifyProviderRequestError(new DOMException('aborted', 'AbortError'), options)
		).toEqual(error('timeout'));
		expect(classifyProviderRequestError(new DOMException('slow', 'TimeoutError'), options)).toEqual(
			error('timeout')
		);
		expect(classifyProviderRequestError(new TypeError('fetch failed'), options)).toEqual(
			error('network')
		);
		expect(classifyProviderRequestError(new Error('bug'), options)).toEqual(error('other'));
		expect(classifyProviderRequestError('nope', options)).toEqual(error('other'));
	});
});

describe('classifyTransportError', () => {
	it('maps the transport codes, directly and through a cause, to network', () => {
		for (const code of [
			'network',
			'dns_not_found',
			'ENOTFOUND',
			'EAI_AGAIN',
			'ECONNREFUSED',
			'ECONNRESET',
		]) {
			expect(classifyTransportError(Object.assign(new Error('x'), { code }))).toEqual(
				error('network')
			);
			expect(classifyTransportError(new Error('x', { cause: { code } }))).toEqual(error('network'));
		}
	});

	it('maps the connection codes Bun reports (a plain Error, not a TypeError) to network', () => {
		for (const code of [
			'ConnectionRefused',
			'ConnectionClosed',
			'FailedToOpenSocket',
			'UND_ERR_SOCKET',
			'EPIPE',
		]) {
			expect(
				classifyTransportError(Object.assign(new Error('Unable to connect.'), { code }))
			).toEqual(error('network'));
		}
	});

	it('classifies the exact error Bun throws for a refused connection as network', () => {
		// Recorded from `await fetch('http://127.0.0.1:1/')` under bun 1.3.3 (this package's tests
		// forbid real transport, so the shape is reproduced): a plain Error, name 'Error', no cause.
		const refused = Object.assign(
			new Error('Unable to connect. Is the computer able to access the url?'),
			{
				code: 'ConnectionRefused',
			}
		);
		expect(refused).not.toBeInstanceOf(TypeError);
		expect(refused.name).toBe('Error');
		expect(classifyTransportError(refused)).toEqual(error('network'));
		expect(classifyProviderRequestError(refused, { statusOutcomes: {} })).toEqual(error('network'));
	});

	it('maps the timeout code, directly and through a cause, to timeout', () => {
		expect(classifyTransportError(Object.assign(new Error('x'), { code: 'timeout' }))).toEqual(
			error('timeout')
		);
		expect(classifyTransportError(new Error('x', { cause: { code: 'timeout' } }))).toEqual(
			error('timeout')
		);
	});

	it('only treats a fetch failure as a network fault, never a programming TypeError', () => {
		expect(classifyTransportError(new TypeError('fetch failed'))).toEqual(error('network'));
		expect(classifyTransportError(new TypeError('Failed to fetch'))).toEqual(error('network'));
		expect(classifyTransportError(new TypeError('x', { cause: { code: 'ECONNREFUSED' } }))).toEqual(
			error('network')
		);
		expect(
			classifyTransportError(new TypeError("Cannot read properties of undefined (reading 'a')"))
		).toBeUndefined();
	});

	it('leaves everything else unclassified', () => {
		expect(classifyTransportError(new Error('x', { cause: { code: 'EACCES' } }))).toBeUndefined();
		expect(classifyTransportError(undefined)).toBeUndefined();
		expect(classifyTransportError('ENOTFOUND')).toBeUndefined();
	});

	it('stops at a self-referencing cause', () => {
		const loop: { cause?: unknown } = {};
		loop.cause = loop;
		expect(providerErrorCode(loop)).toBeUndefined();
	});
});

describe('classifyProviderRequestError: a status decided by the response error code', () => {
	const withCode = (status: number, errorCode?: string) =>
		new ProviderHttpError({ status, ...(errorCode ? { errorCode } : {}) });
	const options = {
		statusOutcomes: {
			400: {
				byErrorCode: { invalid_client: 'auth_failed', invalid_grant: 'auth_failed', gone: 'miss' },
				default: 'http_4xx',
			},
		},
	} as const;

	it('maps the listed codes, including to a miss', () => {
		expect(classifyProviderRequestError(withCode(400, 'invalid_client'), options)).toEqual(
			error('auth_failed')
		);
		expect(classifyProviderRequestError(withCode(400, 'invalid_grant'), options)).toEqual(
			error('auth_failed')
		);
		expect(classifyProviderRequestError(withCode(400, 'gone'), options)).toEqual(miss);
	});

	it('uses the default for an unlisted code or no code', () => {
		expect(classifyProviderRequestError(withCode(400, 'unsupported_grant_type'), options)).toEqual(
			error('http_4xx')
		);
		expect(classifyProviderRequestError(withCode(400), options)).toEqual(error('http_4xx'));
	});

	it('falls through to the range mapping when there is neither a code match nor a default', () => {
		const noDefault = {
			statusOutcomes: { 429: { byErrorCode: { quota: 'auth_failed' } } },
		} as const;
		expect(classifyProviderRequestError(withCode(429, 'quota'), noDefault)).toEqual(
			error('auth_failed')
		);
		expect(classifyProviderRequestError(withCode(429, 'other_code'), noDefault)).toEqual(
			error('rate_limited')
		);
		expect(classifyProviderRequestError(withCode(429), noDefault)).toEqual(error('rate_limited'));
	});

	it('does not look codes up on the prototype chain', () => {
		expect(classifyProviderRequestError(withCode(400, 'constructor'), options)).toEqual(
			error('http_4xx')
		);
		expect(classifyProviderRequestError(withCode(400, 'toString'), options)).toEqual(
			error('http_4xx')
		);
	});

	it('never reinterprets a guard error, whatever its code or status rule', () => {
		const guard = new ProviderHttpError({
			status: 400,
			errorClass: 'target_rejected',
			errorCode: 'invalid_client',
		});
		expect(classifyProviderRequestError(guard, options)).toEqual(error('blocked'));
	});

	it('treats a plain string rule and a rule object alike for other statuses', () => {
		const mixed = {
			statusOutcomes: { ...options.statusOutcomes, 404: 'miss', 401: 'auth_failed' },
		} as const;
		expect(classifyProviderRequestError(withCode(404, 'invalid_client'), mixed)).toEqual(miss);
		expect(classifyProviderRequestError(withCode(401, 'whatever'), mixed)).toEqual(
			error('auth_failed')
		);
	});
});

describe('classifyProviderRequestError: the runtime refusing a redirect', () => {
	it('maps the error code Bun throws for redirect: error to invalid_response', () => {
		// The real runtime error is pinned end to end against a local Bun.serve 302 in
		// atom-classification (imdb-tmdb-find.provider-observer.test.ts); this package's test
		// preload forbids listeners, so the shape is reproduced here: a plain Error with a code.
		const thrown = Object.assign(new Error('UnexpectedRedirect fetching "http://x/"'), {
			code: 'UnexpectedRedirect',
		});
		expect(classifyProviderRequestError(thrown, { statusOutcomes: {} })).toEqual(
			error('invalid_response')
		);
		expect(
			classifyProviderRequestError(new Error('x', { cause: thrown }), { statusOutcomes: {} })
		).toEqual(error('invalid_response'));
	});

	it('does not reinterpret other plain errors', () => {
		expect(classifyProviderRequestError(new Error('boom'), { statusOutcomes: {} })).toEqual(
			error('other')
		);
	});
});
