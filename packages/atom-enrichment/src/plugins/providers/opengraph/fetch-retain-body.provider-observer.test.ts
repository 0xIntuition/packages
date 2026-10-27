import { describe, expect, test } from 'bun:test';
import { createPinAwareFetch } from '../__shared__/http';
import { createHeadSizeLimitError, fetchOpenGraphMetadata } from './fetch';

const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];
const HEAD = '<head><title>t</title><meta property="og:title" content="Kept"></head>';

const fetchWith = (body: string | Uint8Array, chunk = 4096) =>
	createPinAwareFetch(async () => {
		const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body;
		return new Response(
			new ReadableStream({
				start(controller) {
					for (let i = 0; i < bytes.length; i += chunk)
						controller.enqueue(bytes.slice(i, i + chunk));
					controller.close();
				},
			})
		);
	});

const run = (body: string, extra: Record<string, unknown> = {}) =>
	fetchOpenGraphMetadata('https://retain.example/', {
		fetch: fetchWith(body),
		resolveHostname,
		perHostSpacingMs: 0,
		...extra,
	});

describe('retainBodyBytes keeps the page without changing the metadata (ENG-16980)', () => {
	test('metadata and result are identical with and without the retained body', async () => {
		// An og tag in the body must not leak into the metadata, as before.
		const body = `<html>${HEAD}<body><meta property="og:description" content="from body">${'x'.repeat(
			20_000
		)}</body></html>`;
		const plain = await run(body);
		const kept = await run(body, { retainBodyBytes: 1_048_576 });
		expect(kept.metadata).toEqual(plain.metadata);
		expect(kept.metadata.title).toBe('Kept');
		expect(kept.metadata.description).toBe('');
		expect(kept.status).toBe(plain.status);
		expect(kept.fullBody).toEqual({ html: body, status: 'fetched' });
		expect(plain.fullBody).toBeUndefined();
	});

	test('a head beyond the head cap still fails with size_limit without retaining; with retaining the page is kept and flagged', async () => {
		const body = `<html><head><script>${'x'.repeat(2_000)}</script>${HEAD}</head>`;
		const options = { maxBytes: 1_000 };
		const plain = await run(body, options).catch((e: unknown) => e);
		expect((plain as { code?: string }).code).toBe('size_limit');
		// The head cap is the opengraph consumer's: the shared fetch hands the page to the other
		// consumers and flags it, instead of failing them with opengraph's error.
		const kept = await run(body, { ...options, retainBodyBytes: 1_048_576 });
		expect(kept.headCapExceeded).toBe(true);
		expect(kept.status).toBe('no_metadata');
		expect(kept.metadata.title).toBe('');
		expect(kept.fullBody).toEqual({ html: body, status: 'fetched' });
		expect(createHeadSizeLimitError(1_000).message).toBe(
			'OpenGraph response exceeded 1000 bytes before </head>.'
		);
	});

	test('a page without any </head> beyond the head cap is flagged and kept whole', async () => {
		const body = `<meta property="og:title" content="No head"><p>${'y'.repeat(5_000)}</p>`;
		const kept = await run(body, { maxBytes: 1_000, retainBodyBytes: 1_048_576 });
		expect(kept.headCapExceeded).toBe(true);
		expect(kept.fullBody).toEqual({ html: body, status: 'fetched' });
	});

	test('a head closed exactly inside the cap is not flagged', async () => {
		const body = `<html>${HEAD}<body>${'x'.repeat(5_000)}</body></html>`;
		// The first 4096-byte chunk holds the whole head and is not over the 4096-byte cap.
		const kept = await run(body, { maxBytes: 4_096, retainBodyBytes: 1_048_576 });
		expect(kept.headCapExceeded).toBeUndefined();
		expect(kept.metadata.title).toBe('Kept');
	});

	test('a </head> split across chunks is still found (tail scan)', async () => {
		const body = `<html>${HEAD.replace('</head>', '</he')}${'ad  >'}<body>tail</body></html>`;
		const split = body.indexOf('</he') + 4;
		const chunked = (size: number) =>
			createPinAwareFetch(async () => {
				const bytes = new TextEncoder().encode(body);
				return new Response(
					new ReadableStream({
						start(controller) {
							for (let i = 0; i < bytes.length; i += size)
								controller.enqueue(bytes.slice(i, Math.min(bytes.length, i + size)));
							controller.close();
						},
					})
				);
			});
		for (const size of [1, 2, 3, split, 7, 64]) {
			const plain = await fetchOpenGraphMetadata('https://retain.example/', {
				fetch: chunked(size),
				resolveHostname,
				perHostSpacingMs: 0,
			});
			const kept = await fetchOpenGraphMetadata('https://retain.example/', {
				fetch: chunked(size),
				resolveHostname,
				perHostSpacingMs: 0,
				retainBodyBytes: 1_048_576,
			});
			expect(plain.metadata.title).toBe('Kept');
			expect(kept.metadata).toEqual(plain.metadata);
			expect(kept.fullBody).toEqual({ html: body, status: 'fetched' });
		}
	});

	test('without retaining, reading stops at </head>: the rest of the body is never pulled', async () => {
		let pulled = 0;
		const fetcher = createPinAwareFetch(
			async () =>
				new Response(
					new ReadableStream({
						pull(controller) {
							pulled += 1;
							if (pulled > 200) return controller.close();
							controller.enqueue(
								new TextEncoder().encode(pulled === 1 ? `<html>${HEAD}<body>` : 'y'.repeat(4096))
							);
						},
					})
				)
		);
		const common = { fetch: fetcher, resolveHostname, perHostSpacingMs: 0 };
		await fetchOpenGraphMetadata('https://retain.example/', common);
		expect(pulled).toBeLessThanOrEqual(2);
		pulled = 0;
		await fetchOpenGraphMetadata('https://retain.example/', {
			...common,
			retainBodyBytes: 1_048_576,
		});
		expect(pulled).toBeGreaterThan(150);
	});

	test('a page without </head> parses the same whole text', async () => {
		const body = '<meta property="og:title" content="No head tag"><p>hello</p>';
		const plain = await run(body);
		const kept = await run(body, { retainBodyBytes: 1_048_576 });
		expect(kept.metadata).toEqual(plain.metadata);
		expect(kept.metadata.title).toBe('No head tag');
	});

	test('a body past the retain cap reports body_too_large and still yields the head metadata', async () => {
		const body = `<html>${HEAD}<body>${'x'.repeat(50_000)}</body></html>`;
		const kept = await run(body, { retainBodyBytes: 10_000 });
		expect(kept.metadata.title).toBe('Kept');
		expect(kept.fullBody).toEqual({ reason: 'body_too_large', status: 'body_too_large' });
	});
});
