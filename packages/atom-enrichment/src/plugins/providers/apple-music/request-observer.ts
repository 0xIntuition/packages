/**
 * Observation of the free iTunes API requests (ENG-16981). iTunes reports "no
 * such id" and "no match" as HTTP 200 with `resultCount: 0`, so there is no miss
 * status: a miss is an answer the plugin could not use, decided by the caller.
 * Every HTTP error status maps by its class (429 `rate_limited`, 5xx
 * `upstream_5xx`, any other 4xx `http_4xx`; a bad storefront is a 400).
 *
 * Observation only: it never throws, never changes a result and never dials.
 */
import type { AppleMusicOperation } from '@0xintuition/pipeline-runtime/provider-registry';
import {
	beginObservedRequest,
	type ObservedRequest,
	type ObservedRequestContext,
	type RequestOutcome,
} from '@0xintuition/pipeline-runtime/provider-request-observation';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';

export type { ObservedRequestContext };

export type AppleMusicTargetKind = 'lookup' | 'podcast-search' | 'song-search';

export function operationForTarget(kind: AppleMusicTargetKind): AppleMusicOperation {
	if (kind === 'lookup') return 'lookup';
	return kind === 'song-search' ? 'search' : 'podcast_search';
}

export function classifyRequestError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, { statusOutcomes: {} });
}

export function beginAppleMusicRequest(
	kind: AppleMusicTargetKind,
	context: ObservedRequestContext
): ObservedRequest | undefined {
	return beginObservedRequest({
		provider: 'apple-music',
		operation: operationForTarget(kind),
		context,
	});
}
