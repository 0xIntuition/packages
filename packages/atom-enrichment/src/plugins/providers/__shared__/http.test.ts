import { describe, expect, it } from 'bun:test';
import {
	createPinAwareFetch,
	fetchJson,
	fetchProviderHttpResponse,
	type PinnedRequestInit,
} from './http';

describe('loopback fixture admission', () => {
	it.each([
		'127.0.0.1',
		'127.42.0.9',
		'[::1]',
	])('admits and pins only an explicitly enabled loopback literal: %s', async (host) => {
		let dial: PinnedRequestInit | undefined;
		const response = await fetchProviderHttpResponse(
			createPinAwareFetch(async (_url, init) => {
				dial = init;
				return new Response('fixture');
			}),
			`http://${host}:43210/`,
			undefined,
			{ allowLoopbackFixtures: true }
		);
		expect(await response.text()).toBe('fixture');
		expect(dial?.connection).toEqual({
			hostname: host.replace(/^\[|\]$/g, ''),
			address: host.replace(/^\[|\]$/g, ''),
			family: host === '[::1]' ? 6 : 4,
		});
		expect(dial?.redirect).toBe('manual');
	});

	it.each([
		'http://10.0.0.5/',
		'http://169.254.169.254/',
		'http://[fd00::1]/',
		'http://public.example/',
		'http://user:password@127.0.0.1/',
		'ftp://127.0.0.1/',
		// Loopback shorthands that WHATWG parsing would normalize to 127.0.0.1.
		'http://127.1/',
		'http://0x7f000001/',
		'http://2130706433/',
		'http://[::ffff:127.0.0.1]/',
		'http://localhost/',
	])('keeps rejecting non-public targets with the allowance: %s', async (url) => {
		let dials = 0;
		await expect(
			fetchProviderHttpResponse(
				createPinAwareFetch(async () => {
					dials += 1;
					return new Response('unexpected');
				}),
				url,
				undefined,
				{
					allowLoopbackFixtures: true,
					resolve: async () => [{ address: '10.0.0.5', family: 4 }],
				}
			)
		).rejects.toMatchObject({ errorClass: 'target_rejected' });
		expect(dials).toBe(0);
	});

	it('rejects loopback by default', async () => {
		await expect(fetchProviderHttpResponse(fetch, 'http://127.0.0.1:43210/')).rejects.toMatchObject(
			{
				errorClass: 'target_rejected',
			}
		);
	});

	it('does not admit a public hostname that resolves to loopback', async () => {
		await expect(
			fetchProviderHttpResponse(fetch, 'http://public.example/', undefined, {
				allowLoopbackFixtures: true,
				resolve: async () => [{ address: '127.0.0.1', family: 4 }],
			})
		).rejects.toMatchObject({ errorClass: 'target_rejected' });
	});

	it('rejects a redirect from the admitted fixture to metadata before dialing it', async () => {
		let dials = 0;
		await expect(
			fetchProviderHttpResponse(
				createPinAwareFetch(async () => {
					dials += 1;
					return new Response(null, {
						status: 302,
						headers: { location: 'http://169.254.169.254/' },
					});
				}),
				'http://127.0.0.1:43210/',
				undefined,
				{ allowLoopbackFixtures: true }
			)
		).rejects.toMatchObject({ errorClass: 'target_rejected' });
		expect(dials).toBe(1);
	});
});

describe('credential headers on redirect hops', () => {
	const dnsResolve = async () => [{ address: '93.184.216.34', family: 4 as const }];

	function recordingChain(locations: Record<string, string | undefined>) {
		const hops: Array<{ url: string; headers: Record<string, string> }> = [];
		const fetch = createPinAwareFetch(async (url, init) => {
			hops.push({ url, headers: Object.fromEntries(new Headers(init?.headers)) });
			const next = locations[url];
			return next
				? new Response(null, { status: 302, headers: { location: next } })
				: new Response('done');
		});
		return { fetch, hops };
	}

	const secrets = {
		authorization: 'Bearer fake-token',
		cookie: 'session=fake',
		'proxy-authorization': 'Basic ZmFrZTpmYWtl',
		accept: 'application/json',
	};

	it('strips authorization, cookie and proxy-authorization on a cross-origin hop, keeps the rest', async () => {
		const { fetch, hops } = recordingChain({
			'https://origin.example/start': 'https://other.example/landing',
		});
		await fetchProviderHttpResponse(
			fetch,
			'https://origin.example/start',
			{ headers: secrets },
			{ resolve: dnsResolve }
		);
		expect(hops.map((hop) => hop.url)).toEqual([
			'https://origin.example/start',
			'https://other.example/landing',
		]);
		expect(hops[0]?.headers).toMatchObject(secrets);
		expect(hops[1]?.headers).toEqual({ accept: 'application/json' });
	});

	it('keeps the headers on a same-origin hop', async () => {
		const { fetch, hops } = recordingChain({
			'https://origin.example/start': '/next',
		});
		await fetchProviderHttpResponse(
			fetch,
			'https://origin.example/start',
			{ headers: secrets },
			{ resolve: dnsResolve }
		);
		expect(hops[1]?.url).toBe('https://origin.example/next');
		expect(hops[1]?.headers).toMatchObject(secrets);
	});

	it('treats another scheme on the same host as another origin', async () => {
		const { fetch, hops } = recordingChain({
			'https://origin.example/a': 'http://origin.example/b',
		});
		await fetchProviderHttpResponse(
			fetch,
			'https://origin.example/a',
			{ headers: secrets },
			{ resolve: dnsResolve }
		);
		expect(hops[1]?.headers.authorization).toBeUndefined();
	});

	it('does not give the credentials back when a later hop returns to the original origin', async () => {
		const { fetch, hops } = recordingChain({
			'https://origin.example/a': 'https://other.example/b',
			'https://other.example/b': 'https://origin.example/c',
		});
		await fetchProviderHttpResponse(
			fetch,
			'https://origin.example/a',
			{ headers: secrets },
			{ resolve: dnsResolve }
		);
		expect(hops).toHaveLength(3);
		expect(hops[2]?.headers.authorization).toBeUndefined();
		expect(hops[2]?.headers.cookie).toBeUndefined();
	});

	it('strips from Headers and tuple-array inits as well as plain objects', async () => {
		for (const headers of [
			new Headers(secrets),
			Object.entries(secrets) as Array<[string, string]>,
		]) {
			const { fetch, hops } = recordingChain({
				'https://origin.example/a': 'https://other.example/b',
			});
			await fetchProviderHttpResponse(
				fetch,
				'https://origin.example/a',
				{ headers },
				{
					resolve: dnsResolve,
				}
			);
			expect(hops[1]?.headers).toEqual({ accept: 'application/json' });
		}
	});
});

describe('ProviderHttpError.errorCode', () => {
	const dnsResolve = async () => [{ address: '93.184.216.34', family: 4 as const }];
	const failing = (body: string, status = 400) =>
		createPinAwareFetch(async () => new Response(body, { status }));
	const codeOf = async (
		body: string,
		capture: boolean,
		status = 400
	): Promise<string | undefined> => {
		const error = await fetchJson(failing(body, status), 'https://api.example/token', undefined, {
			resolve: dnsResolve,
			...(capture ? { captureErrorCode: true } : {}),
		}).catch((e: unknown) => e);
		expect(error).toMatchObject({ name: 'ProviderHttpError', status });
		return (error as { errorCode?: string }).errorCode;
	};

	it('is captured only when the request opts in', async () => {
		const body = JSON.stringify({ error: 'invalid_client' });
		expect(await codeOf(body, true)).toBe('invalid_client');
		expect(await codeOf(body, false)).toBeUndefined();
	});

	it('is undefined for an error body over 4 KiB, even when it starts with a valid code', async () => {
		const padding = 'x'.repeat(4096);
		const oversized = JSON.stringify({ error: 'invalid_client', error_description: padding });
		expect(oversized.length).toBeGreaterThan(4096);
		expect(await codeOf(oversized, true)).toBeUndefined();
	});

	it('keeps a body of exactly the limit readable', async () => {
		const base = JSON.stringify({ error: 'invalid_client', d: '' });
		const exact = JSON.stringify({ error: 'invalid_client', d: 'x'.repeat(4096 - base.length) });
		expect(exact.length).toBe(4096);
		expect(await codeOf(exact, true)).toBe('invalid_client');
	});

	it.each([
		['free text', '{"error":"Invalid client, go away"}'],
		['upper case', '{"error":"INVALID_CLIENT"}'],
		['a non-string', '{"error":42}'],
		['a code over 64 characters', `{"error":"${'a'.repeat(65)}"}`],
		['not JSON', '<html>nope</html>'],
	])('is undefined for %s', async (_name, body) => {
		expect(await codeOf(body, true)).toBeUndefined();
	});
});
