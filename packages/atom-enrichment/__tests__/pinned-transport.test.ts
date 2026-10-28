import { expect, mock, test } from 'bun:test';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { gzipSync } from 'node:zlib';

let compressed = false;
let admittedAddress = '8.8.8.8';
const requests: Array<{ url: URL; options: Record<string, unknown>; address: string }> = [];
// mock-module-exempt: exercise the production pinned HTTP adapter without any socket.
mock.module('node:https', () => ({
	request: (url: URL, options: Record<string, unknown>, callback: (response: Readable) => void) => {
		const request = new EventEmitter();
		Object.assign(request, {
			end: () => {
				let address = '10.0.0.5'; // A second DNS lookup would rebind privately.
				const lookup = options.lookup as (
					host: string,
					options: { all: boolean },
					cb: (...args: unknown[]) => void
				) => void;
				lookup(url.hostname, { all: false }, (error, resolved, family) => {
					expect(error).toBeNull();
					expect(family).toBe(4);
					address = String(resolved);
				});
				lookup(url.hostname, { all: true }, (error, resolved) => {
					expect(error).toBeNull();
					expect(resolved).toEqual([{ address: admittedAddress, family: 4 }]);
				});
				lookup('other.example', { all: false }, (error) => {
					expect(error).toBeInstanceOf(Error);
				});
				requests.push({ url, options, address });
				const incoming = Object.assign(
					Readable.from([
						compressed
							? gzipSync(Buffer.from('{"public":true}'))
							: Buffer.from(address === '8.8.8.8' ? '{"public":true}' : '{"private":true}'),
					]),
					{
						rawHeaders: compressed
							? [
									'content-type',
									'application/json',
									'content-encoding',
									'gzip',
									'content-length',
									'35',
								]
							: ['content-type', 'application/json'],
						statusCode: 200,
					}
				);
				callback(incoming);
			},
		});
		return request;
	},
}));

const { createPinAwareFetch, fetchJson, fetchProviderHttpHop, fetchWithPinnedNodeTransport } =
	await import('../src/plugins/providers/__shared__/http');

test('production adapter uses only the admitted DNS address and preserves Host and SNI', async () => {
	expect(
		await fetchJson<{ public: boolean }>(
			globalThis.fetch as never,
			'https://rebind.example/',
			{ headers: { Host: 'evil.example' } },
			{ resolve: async () => [{ address: '8.8.8.8', family: 4 }] }
		)
	).toEqual({ public: true });
	const last = requests.at(-1)!;
	expect(last.address).toBe('8.8.8.8');
	expect(last.url.hostname).toBe('rebind.example');
	expect(last.options.headers).toMatchObject({ host: 'rebind.example' });
	expect(last.options.servername).toBe('rebind.example');
	expect(last.options.agent).toBe(false);
});

test('production adapter fails closed without a matching validated connection', async () => {
	for (const connection of [
		undefined,
		{ hostname: 'other.example', address: '8.8.8.8', family: 4 },
	]) {
		await expect(
			fetchWithPinnedNodeTransport('https://rebind.example/', { connection })
		).rejects.toThrow('validated connection');
	}
});

test('pinned adapter preserves fetch decompression and caps decoded bytes', async () => {
	compressed = true;
	try {
		expect(
			await fetchJson<{ public: boolean }>(
				globalThis.fetch as never,
				'https://rebind.example/',
				undefined,
				{ resolve: async () => [{ address: '8.8.8.8', family: 4 }] }
			)
		).toEqual({ public: true });
		await expect(
			fetchJson(globalThis.fetch as never, 'https://rebind.example/', undefined, {
				resolve: async () => [{ address: '8.8.8.8', family: 4 }],
				maxResponseBytes: 4,
			})
		).rejects.toMatchObject({ errorClass: 'response_too_large' });
	} finally {
		compressed = false;
	}
});

for (const kind of ['plain', 'bound', 'wrapped', 'replaced-global'] as const) {
	test(`round 5 ignores ${kind} fetch that would re-resolve privately`, async () => {
		const previousFetch = globalThis.fetch;
		let privateDials = 0;
		const ordinaryFetch = async () => {
			const resolveAtDial = async () => [{ address: '10.0.0.5', family: 4 }];
			const [connection] = await resolveAtDial();
			if (connection?.address === '10.0.0.5') privateDials++;
			return new Response('{"private":true}');
		};
		const fetcher =
			kind === 'bound'
				? ordinaryFetch.bind(undefined)
				: kind === 'wrapped'
					? () => ordinaryFetch()
					: ordinaryFetch;
		if (kind === 'replaced-global')
			globalThis.fetch = Object.assign(fetcher, { preconnect: () => undefined }) as typeof fetch;
		const before = requests.length;
		try {
			expect(
				await fetchJson<{ public: boolean }>(
					kind === 'replaced-global' ? (globalThis.fetch as never) : fetcher,
					'https://rebind.example/',
					undefined,
					{ resolve: async () => [{ address: '8.8.8.8', family: 4 }] }
				)
			).toEqual({ public: true });
			expect(privateDials).toBe(0);
			expect(requests.length).toBe(before + 1);
			expect(requests.at(-1)?.address).toBe('8.8.8.8');
		} finally {
			globalThis.fetch = previousFetch;
		}
	});
}

test('round 5 explicit pin-aware adapters receive the admitted connection', async () => {
	let dials = 0;
	const fetcher = createPinAwareFetch(async (_url, init) => {
		dials++;
		expect(init?.connection).toEqual({
			hostname: 'fixture.example',
			address: '8.8.8.8',
			family: 4,
		});
		expect(init?.redirect).toBe('manual');
		return Response.json({ fixture: true });
	});
	expect(
		await fetchJson<{ fixture: boolean }>(fetcher, 'https://fixture.example', undefined, {
			resolve: async () => [{ address: '8.8.8.8', family: 4 }],
		})
	).toEqual({ fixture: true });
	expect(dials).toBe(1);
});

test('round 5 seed private-network override still pins an ordinary fetch to its admitted address', async () => {
	admittedAddress = '127.0.0.1';
	let ordinaryDials = 0;
	try {
		const response = await fetchProviderHttpHop(
			async () => {
				ordinaryDials++;
				throw new Error('unmarked adapter must be ignored');
			},
			'https://seed.example/',
			undefined,
			{
				allowPrivateNetwork: true,
				resolve: async () => [{ address: '127.0.0.1', family: 4 }],
			}
		);
		await response.text();
		expect(requests.at(-1)?.address).toBe('127.0.0.1');
		expect(ordinaryDials).toBe(0);
	} finally {
		admittedAddress = '8.8.8.8';
	}
});
