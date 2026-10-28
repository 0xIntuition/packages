import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';

type LegacyResponse = { ok: boolean; status: number; json(): Promise<unknown> };

/**
 * Adapts a fixture fetch that answers `{ ok, status, json() }` to the pin-aware `Response` fetch
 * the shared Spotify client dials through, so each fixture keeps its shape.
 */
export function legacySpotifyFetch(
	handler: (url: string, init?: RequestInit) => Promise<LegacyResponse>
) {
	return createPinAwareFetch(async (url: string, init?: RequestInit) => {
		const legacy = await handler(url, init);
		return new Response(JSON.stringify(await legacy.json()), {
			status: legacy.status,
			headers: { 'content-type': 'application/json' },
		});
	});
}
