import { expect, test } from 'bun:test';
import { createPinAwareFetch, type FetchLike } from '../src/plugins/providers/__shared__/http';
import { createPlacesPlugin } from '../src/plugins/providers/places';
import { createProductListingPlugin } from '../src/plugins/providers/product-listing';
import { createMockAtomInput, createMockRequest } from '../src/testing';

for (const provider of ['amazon', 'maps'] as const) {
	test(`${provider} short links reject private redirects before transport follows them`, async () => {
		let privateConnections = 0;
		const redirects: Array<RequestRedirect | undefined> = [];
		const fetcher: FetchLike = async (url, init) => {
			redirects.push(init?.redirect);
			if (init?.redirect === 'follow' || url.includes('169.254.169.254')) privateConnections++;
			return new Response(null, {
				status: 302,
				headers: { location: 'http://169.254.169.254/secret' },
			});
		};
		const url =
			provider === 'amazon' ? 'https://amzn.to/fixture' : 'https://maps.app.goo.gl/fixture';
		const plugin =
			provider === 'amazon'
				? createProductListingPlugin({ apiKey: 'fixture', fetch: createPinAwareFetch(fetcher) })
				: createPlacesPlugin({ fetch: createPinAwareFetch(fetcher) });
		await plugin.enrich(createMockRequest({ input: createMockAtomInput({ hints: { url } }) }), {
			now: () => '2026-10-12T00:00:00Z',
			signal: new AbortController().signal,
		});
		expect(redirects).toEqual(['manual']);
		expect(privateConnections).toBe(0);
	});
}
