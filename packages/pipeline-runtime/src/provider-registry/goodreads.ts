import { defineProvider, PAGE_OPERATION_SPEC } from './types';

/**
 * The goodreads.com page fetched by enrichment (opengraph and microdata). Classification never
 * fetches it; enrichment does, once per run: the two plugins share one fetch (ENG-16980). The
 * plugin that makes the request records `source=live` (the only series that counts fetches);
 * the other records `source=cache` with its own hit or miss. A failed fetch is recorded once,
 * live: a failure is never served from cache, so the registry has no cached error series.
 * If the plugin that made the request gives up alone (its own timeout) while the other still gets the
 * page, the first records its timeout live and the other a cache hit: one fetch, two events.
 * The cache series is for in-run sharing only: opengraph and microdata declare no engine
 * `observability`, so artifact-cache hits record nothing. If either ever gains `observability`,
 * its artifact-cache hits would land in these same `source=cache` series next to the in-run ones.
 */
export const goodreadsProvider = defineProvider({
	provider: 'goodreads',
	operations: {
		page: PAGE_OPERATION_SPEC,
	},
	circuitHosts: [],
});
