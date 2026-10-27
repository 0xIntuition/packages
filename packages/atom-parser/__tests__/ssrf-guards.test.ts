import { describe, expect, it } from 'bun:test';
import { inspectRemote } from '../src/remote';
import { DEFAULT_FETCH_POLICY, type ParseResult } from '../src/types';

const publicResolve = async () => [{ address: '8.8.8.8', family: 4 as const }];
function result(url: string): ParseResult {
	return { kind: 'url', canonicalUrl: url } as ParseResult;
}

describe('parser SSRF guard on every hop', () => {
	for (const url of [
		'http://169.254.169.254/',
		'https://[::1]/',
		'https://[::ffff:7f00:1]/',
		'https://[fd00::1]/',
		'https://[fe80::1]/',
		'https://[ff02::1]/',
		'https://[::]/',
		'https://private.example/',
	]) {
		it(`denies ${url}`, async () => {
			let calls = 0;
			const output = await inspectRemote(
				result(url),
				{ ...DEFAULT_FETCH_POLICY, allowHttp: true },
				{
					fetcher: async () => {
						calls++;
						return new Response('secret');
					},
					resolve: async () => [{ address: '10.0.0.5', family: 4 }],
				}
			);
			expect(output?.inspection.outcome).toBe('denied');
			expect(calls).toBe(0);
		});
	}
	it('retains resolver outages as errors while denying mixed private answers', async () => {
		for (const resolve of [
			async () => {
				throw new Error('EAI_AGAIN');
			},
			async () => {
				throw new Error('resolver localhost outage');
			},
			async () => {
				throw new DOMException('resolver aborted', 'AbortError');
			},
			async () => [],
		]) {
			const output = await inspectRemote(result('https://mixed.example/'), DEFAULT_FETCH_POLICY, {
				fetcher: async () => {
					throw new Error('must not fetch');
				},
				resolve,
			});
			expect(output?.inspection.outcome).toBe('error');
			expect(output?.inspection.finalUrl).toBe('https://mixed.example/');
		}
		const mixed = await inspectRemote(result('https://mixed.example/'), DEFAULT_FETCH_POLICY, {
			resolve: async () => [
				{ address: '8.8.8.8', family: 4 },
				{ address: '::1', family: 6 },
			],
		});
		expect(mixed?.inspection.outcome).toBe('denied');
	});
	it('validates DNS again on redirects', async () => {
		let calls = 0;
		const output = await inspectRemote(result('https://public.example/'), DEFAULT_FETCH_POLICY, {
			resolve: async (host) => [
				{ address: host === 'public.example' ? '8.8.8.8' : '10.0.0.5', family: 4 },
			],
			fetcher: async () => {
				calls++;
				return new Response(null, {
					status: 302,
					headers: { location: 'https://private.example/' },
				});
			},
		});
		expect(output?.inspection.outcome).toBe('denied');
		expect(calls).toBe(1);
	});
	it('accepts public targets and preserves HTTP/private policy overrides', async () => {
		const fetcher = async () =>
			new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
		expect(
			(
				await inspectRemote(result('https://public.example/'), DEFAULT_FETCH_POLICY, {
					resolve: publicResolve,
					fetcher,
				})
			)?.inspection.outcome
		).toBe('success');
		expect(
			(
				await inspectRemote(result('http://8.8.8.8/'), DEFAULT_FETCH_POLICY, {
					resolve: publicResolve,
					fetcher,
				})
			)?.inspection.outcome
		).toBe('denied');
		expect(
			(
				await inspectRemote(
					result('http://127.0.0.1/'),
					{ ...DEFAULT_FETCH_POLICY, allowHttp: true, allowPrivateNetworks: true },
					{
						resolve: async () => {
							throw new Error('should not resolve');
						},
						fetcher,
					}
				)
			)?.inspection.outcome
		).toBe('success');
	});
});

it('pins each admitted address instead of letting the transport re-resolve privately', async () => {
	let privateConnections = 0;
	let calls = 0;
	const output = await inspectRemote(result('https://rebind.example/'), DEFAULT_FETCH_POLICY, {
		resolve: publicResolve,
		fetcher: async (_url, init) => {
			const connection = (init as RequestInit & { connection?: { address: string } })?.connection;
			if (connection?.address !== '8.8.8.8') privateConnections++;
			return ++calls === 1
				? new Response(null, { status: 302, headers: { location: 'https://second.example/' } })
				: new Response('{"public":true}', { headers: { 'content-type': 'application/json' } });
		},
	});
	expect(output?.inspection.outcome).toBe('success');
	expect(privateConnections).toBe(0);
	expect(calls).toBe(2);
});

it('keeps the deadline armed while a body stalls below the byte cap', async () => {
	let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
	let signal: AbortSignal | undefined;
	let cancelled = false;
	const pending = inspectRemote(
		result('https://public.example/'),
		{ ...DEFAULT_FETCH_POLICY, requestTimeoutMs: 20 },
		{
			resolve: publicResolve,
			fetcher: async (_url, init) => {
				signal = init?.signal ?? undefined;
				return new Response(
					new ReadableStream<Uint8Array>({
						start(controller) {
							streamController = controller;
							controller.enqueue(new Uint8Array([1]));
						},
						cancel() {
							cancelled = true;
						},
					})
				);
			},
		}
	);
	try {
		const output = await Promise.race([
			pending,
			new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 80)),
		]);
		expect(output?.inspection.outcome).toBe('timeout');
		expect(signal?.aborted).toBe(true);
		expect(cancelled).toBe(true);
	} finally {
		if (!cancelled) streamController?.close();
		await pending;
	}
});

it('cancels declared oversized bodies without acquiring any bytes', async () => {
	let reads = 0;
	let cancelled = false;
	const output = await inspectRemote(
		result('https://public.example/'),
		{ ...DEFAULT_FETCH_POLICY, maxResponseBytes: 4 },
		{
			resolve: publicResolve,
			fetcher: async () =>
				new Response(
					new ReadableStream(
						{
							pull() {
								reads++;
							},
							cancel() {
								cancelled = true;
							},
						},
						{ highWaterMark: 0 }
					),
					{ headers: { 'content-length': '100' } }
				),
		}
	);
	expect(output?.inspection.outcome).toBe('oversized');
	expect(reads).toBe(0);
	expect(cancelled).toBe(true);
});

it('parser prefers IPv4 from admitted dual-family answers', async () => {
	let address: string | undefined;
	await inspectRemote(result('https://dual.example/'), DEFAULT_FETCH_POLICY, {
		resolve: async () => [
			{ address: '2606:4700:4700::1111', family: 6 },
			{ address: '8.8.8.8', family: 4 },
		],
		fetcher: async (_url, init) => {
			address = init?.connection?.address;
			return new Response('public');
		},
	});
	expect(address).toBe('8.8.8.8');
});
