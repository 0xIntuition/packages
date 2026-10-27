// Transport-bound Amazon helper, kept apart from the pure URL parsers in
// `amazon.ts` so the classification → enrichment handoff (and through it the
// client schema graph) never reaches provider transport.

import { isAmazonHostname } from './amazon';
import { type FetchLike, fetchProviderHttpResponse } from './http';

// Follows the shortener redirect and returns the destination product URL.
// Returns undefined when the redirect does not land on an Amazon host, so a
// hijacked or expired short link can never inject a foreign URL downstream.
export async function resolveAmazonShortLink(
	fetcher: FetchLike,
	url: string,
	signal?: AbortSignal
): Promise<string | undefined> {
	try {
		const response = await fetchProviderHttpResponse(fetcher, url, {
			method: 'GET',
			...(signal ? { signal } : {}),
		});
		await response.body?.cancel().catch(() => undefined);
		const destination = response.url || undefined;
		if (!destination) {
			return undefined;
		}
		return isAmazonHostname(new URL(destination).hostname) ? destination : undefined;
	} catch {
		return undefined;
	}
}
