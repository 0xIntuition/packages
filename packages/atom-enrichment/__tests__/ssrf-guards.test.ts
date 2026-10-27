import { describe, expect, it } from 'bun:test';
import {
	createPinAwareFetch,
	fetchJson,
	fetchText,
} from '../src/plugins/providers/__shared__/http';

const publicResolve = async () => [{ address: '8.8.8.8', family: 4 as const }];
const blocked = [
	'http://169.254.169.254/',
	'https://[::1]/',
	'https://[::ffff:7f00:1]/',
	'https://[fd00::1]/',
	'https://[fe80::1]/',
	'https://[ff02::1]/',
	'https://[::]/',
	'file:///etc/passwd',
	'https://private.example/',
];

describe('provider SSRF admission and bounded bodies', () => {
	for (const url of blocked) {
		it(`rejects ${url} before fetching and returns no target or body`, async () => {
			let calls = 0;
			const fetcher = async () => {
				calls++;
				return new Response('internal body');
			};
			await expect(
				fetchText(createPinAwareFetch(fetcher), url, undefined, {
					resolve: async () => [{ address: '10.0.0.5', family: 4 }],
				})
			).rejects.toMatchObject({ errorClass: 'target_rejected' });
			expect(calls).toBe(0);
		});
	}
	it('rejects a private redirect after a public initial hop', async () => {
		let calls = 0;
		const fetcher = async () => {
			calls++;
			return new Response(null, { status: 302, headers: { location: 'https://[::1]/secret' } });
		};
		await expect(
			fetchText(createPinAwareFetch(fetcher), 'https://public.example/', undefined, {
				resolve: publicResolve,
			})
		).rejects.toMatchObject({ errorClass: 'target_rejected' });
		expect(calls).toBe(1);
	});
	it('rejects mixed public/private DNS answers', async () => {
		await expect(
			fetchText(
				createPinAwareFetch(async () => new Response('bad')),
				'https://mixed.example/',
				undefined,
				{
					resolve: async () => [
						{ address: '8.8.8.8', family: 4 },
						{ address: '::1', family: 6 },
					],
				}
			)
		).rejects.toMatchObject({ errorClass: 'target_rejected' });
	});
	it('accepts a public host and relative public redirect', async () => {
		let calls = 0;
		const fetcher = async () =>
			++calls === 1
				? new Response(null, { status: 302, headers: { location: '/final' } })
				: new Response('{"ok":true}');
		expect(
			await fetchJson<{ ok: boolean }>(
				createPinAwareFetch(fetcher),
				'https://public.example/',
				undefined,
				{
					resolve: publicResolve,
				}
			)
		).toEqual({ ok: true });
		expect(calls).toBe(2);
	});
	it('caps streamed UTF-8 bytes and cancels excess bodies', async () => {
		let cancelled = false;
		const fetcher = async () =>
			new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(new TextEncoder().encode('ééé'));
					},
					cancel() {
						cancelled = true;
					},
				})
			);
		await expect(
			fetchText(createPinAwareFetch(fetcher), 'https://public.example/', undefined, {
				resolve: publicResolve,
				maxResponseBytes: 4,
			})
		).rejects.toMatchObject({ errorClass: 'response_too_large' });
		expect(cancelled).toBe(true);
	});
	it('drops URL and fetched body from HTTP errors', async () => {
		try {
			await fetchText(
				createPinAwareFetch(async () => new Response('internal secret', { status: 500 })),
				'https://public.example/private',
				undefined,
				{ resolve: publicResolve }
			);
			throw new Error('expected rejection');
		} catch (error) {
			expect(error).toMatchObject({ status: 500 });
			expect(JSON.stringify(error)).not.toContain('private');
			expect(JSON.stringify(error)).not.toContain('internal secret');
			expect(error).not.toHaveProperty('requestUrl');
			expect(error).not.toHaveProperty('bodyExcerpt');
			expect((error as Error).message).not.toContain('https://');
		}
	});
});

it('enforces the 1 MiB default for JSON even when callers request a larger limit', async () => {
	for (const maxResponseBytes of [undefined, 2_097_152]) {
		await expect(
			fetchJson(
				createPinAwareFetch(async () => new Response('x'.repeat(1_048_577))),
				'https://public.example/',
				undefined,
				{ resolve: publicResolve, maxResponseBytes }
			)
		).rejects.toMatchObject({ errorClass: 'response_too_large' });
	}
});
it('cancels oversized declared bodies without consuming them', async () => {
	let reads = 0;
	let cancelled = false;
	const fetcher = async () =>
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
		);
	await expect(
		fetchText(createPinAwareFetch(fetcher), 'https://public.example/', undefined, {
			resolve: publicResolve,
			maxResponseBytes: 4,
		})
	).rejects.toMatchObject({ errorClass: 'response_too_large' });
	expect(reads).toBe(0);
	expect(cancelled).toBe(true);
});
it('cancels HTTP error bodies without reading or echoing them', async () => {
	let cancelled = false;
	const fetcher = async () =>
		new Response(
			new ReadableStream(
				{
					pull() {
						throw new Error('must not read diagnostic body');
					},
					cancel() {
						cancelled = true;
					},
				},
				{ highWaterMark: 0 }
			),
			{ status: 503 }
		);
	await expect(
		fetchText(createPinAwareFetch(fetcher), 'https://public.example/', undefined, {
			resolve: publicResolve,
		})
	).rejects.toMatchObject({ status: 503 });
	expect(cancelled).toBe(true);
});

it('pins every admitted hop so a transport DNS rebind cannot reach a private endpoint', async () => {
	let privateConnections = 0;
	let calls = 0;
	const fetcher = async (_url: string, init?: RequestInit) => {
		const connection = (init as RequestInit & { connection?: { address: string } })?.connection;
		if (connection?.address !== '8.8.8.8') privateConnections++;
		return ++calls === 1
			? new Response(null, { status: 302, headers: { location: 'https://second.example/final' } })
			: new Response(connection?.address === '8.8.8.8' ? 'public' : 'private content');
	};
	expect(
		await fetchText(createPinAwareFetch(fetcher), 'https://rebind.example/', undefined, {
			resolve: publicResolve,
		})
	).toBe('public');
	expect(privateConnections).toBe(0);
	expect(calls).toBe(2);
});
