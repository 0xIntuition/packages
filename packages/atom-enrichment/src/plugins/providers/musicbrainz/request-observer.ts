import { RATE_LIMITED_KIND } from '@0xintuition/pipeline-runtime/provider-observer';
import type { ProviderOperationOf } from '@0xintuition/pipeline-runtime/provider-registry';
import {
	type ObservedRequestContext,
	observeSlottedProviderRequest,
	type RequestOutcome,
} from '@0xintuition/pipeline-runtime/provider-request-observation';
import type { RequestSlot } from '@0xintuition/pipeline-runtime/request-slot';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';

export type MusicBrainzOperation = ProviderOperationOf<'musicbrainz'>;

/**
 * MusicBrainz documents 503 as its per-IP throttle response. It is NOT listed in the metric
 * `statusOutcomes`: passed to the HTTP layer as `statusClasses`, the error is born with class
 * `rate_limited`, which the errorClass-first classifier maps to the `rate_limited` reason and the
 * engine maps to a retriable `rate_limited` error. Every MusicBrainz 503, a real outage included,
 * counts as a rate limit. Other providers' 503s are untouched.
 */
export const MUSICBRAINZ_STATUS_CLASSES: Readonly<Record<number, string>> = {
	503: RATE_LIMITED_KIND,
};

/**
 * A 404 is a miss (the id does not exist) and a 403 means MusicBrainz refused our User-Agent
 * (`auth_failed`). 429 is rate limiting by status already.
 */
export function classifyRequestError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, {
		statusOutcomes: { 404: 'miss', 403: 'auth_failed' },
	});
}

/**
 * What a resolved lookup means. A search or ISRC lookup with nothing found is a 200 with
 * `"recordings":[]` (live), and a recording without id or title yields no artifact: both are a
 * `miss`, not a `hit`. The argument is the recording the lookup picked.
 */
export function classifyMusicBrainzResult(
	recording: { id?: string | undefined; title?: string | undefined } | undefined
): 'hit' | 'miss' {
	return recording?.id && recording.title ? 'hit' : 'miss';
}

/**
 * Runs one MusicBrainz request through the process-wide slot and reports it. The abort, deadline
 * and slot rules are the shared ones in `provider-request-observation`; a 404 still throws here
 * so it is recorded as a miss, and the caller turns it into "no result".
 */
export async function observeRequest<
	T extends { id?: string | undefined; title?: string | undefined } | undefined,
>(
	slot: RequestSlot,
	operation: MusicBrainzOperation,
	context: ObservedRequestContext,
	request: (signal: AbortSignal) => Promise<T>
): Promise<T> {
	return await observeSlottedProviderRequest(
		{
			provider: 'musicbrainz',
			operation,
			context,
			classifyError: classifyRequestError,
			classifyResult: classifyMusicBrainzResult,
		},
		slot,
		request
	);
}
