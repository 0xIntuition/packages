import type { ProviderOperationOf } from '@0xintuition/pipeline-runtime/provider-registry';
import type { ObservedRequestContext } from '@0xintuition/pipeline-runtime/provider-request-observation';
import type { RequestSlot } from '@0xintuition/pipeline-runtime/request-slot';
import type { z } from 'zod/v4';
import type { PinAwareFetch } from './http';
import {
	fetchProviderJson,
	getWikimediaRequestSlot,
	rejectMediaWikiActionApiError,
	WIKIMEDIA_STATUS_OUTCOMES,
	WIKIMEDIA_USER_AGENT,
	withoutMediaWikiApiError,
} from './provider-fetch';

/**
 * The one way enrichment talks to Wikimedia (Wikidata API, EntityData and the Wikipedia REST
 * summary; ENG-17015): the descriptive User-Agent the policy requires (without one Wikimedia
 * answers 403), the process-wide pacing slot ({@link getWikimediaRequestSlot}), the provider-request observation, and the two ways
 * Wikimedia says "slow down" that a status code alone does not carry.
 *
 * Live checks (2026-10-22, see the PR):
 * - no User-Agent: 403 `Please set a user-agent and respect our robot policy`;
 * - `api.php?...&maxlag=-1`: HTTP 200, `Retry-After: 5` and `{"error":{"code":"maxlag",...}}`;
 * - `Special:EntityData/Qn.json?maxlag=-1`: HTTP 200 with the entity, so `maxlag` is only sent to
 *   `api.php`;
 * - a missing entity (`Q999999999`): 404 (HTML); a malformed id (11 digits): 400;
 * - a missing summary: 404 with a JSON body; `wbsearchentities` without a match: 200 `search: []`.
 */

export type WikimediaClientOptions = {
	/** Test seam: a private slot (for example `createRequestSlot({ minSpacingMs: 0 })`). Production always uses the process slot. */
	requestSlot?: RequestSlot;
};

/** The transport and pacing a plugin instance calls Wikimedia with. */
export type WikimediaClient = {
	/** A pin-aware fetch (fixtures); `undefined` dials through the default pinned transport. */
	fetcher: PinAwareFetch | undefined;
	slot: RequestSlot;
};

export function createWikimediaClient(
	fetcher: PinAwareFetch | undefined,
	options: WikimediaClientOptions = {}
): WikimediaClient {
	return { fetcher, slot: options.requestSlot ?? getWikimediaRequestSlot() };
}

export type WikimediaJsonRequest<T, P extends 'wikidata' | 'wikipedia'> = {
	client: WikimediaClient;
	provider: P;
	operation: ProviderOperationOf<P>;
	url: string;
	schema: z.ZodType<T>;
	context: ObservedRequestContext;
	/** The action API (`api.php`) reports errors as HTTP 200 (header or `{error}` body); EntityData and REST do not. */
	actionApi?: boolean;
	/** A resolved value that holds nothing is a `miss`. Default: `hit`. */
	classifyResult?: (value: T) => 'hit' | 'miss';
};

/**
 * One paced, observed, User-Agent-carrying Wikimedia JSON request on the shared provider fetch. A
 * 404 is recorded as a miss and still throws, so the caller turns it into "no result" with
 * {@link isWikimediaMiss}.
 */
export async function wikimediaJson<T, P extends 'wikidata' | 'wikipedia'>(
	request: WikimediaJsonRequest<T, P>
): Promise<T> {
	return await fetchProviderJson({
		url: request.url,
		fetch: request.client.fetcher,
		headers: { accept: 'application/json' },
		userAgent: WIKIMEDIA_USER_AGENT,
		signal: request.context.signal,
		deadlineAtMs: request.context.deadlineAtMs,
		slot: request.client.slot,
		...(request.actionApi ? { rejectOk: rejectMediaWikiActionApiError } : {}),
		schema: request.actionApi ? withoutMediaWikiApiError(request.schema) : request.schema,
		observe: {
			provider: request.provider,
			operation: request.operation,
			statusOutcomes: WIKIMEDIA_STATUS_OUTCOMES,
			classifyResult: request.classifyResult,
		},
	});
}
