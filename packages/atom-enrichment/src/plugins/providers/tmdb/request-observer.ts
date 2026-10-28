/**
 * Meaning of a failed TMDB v3 request (ENG-17018), shared by the enrichment `details` lookup and
 * the classification IMDb-to-TMDB `find` bridge. It names no TMDB host: the caller owns the
 * pinned (or guarded) transport; this only says what a failure means. Public subpath surface:
 * the classifier only.
 *
 * Observation only: it never throws and never changes a result.
 */
import type { RequestOutcome } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';
import { TmdbPayloadMismatchError } from './payload-mismatch';

/**
 * TMDB answers an unknown or withdrawn id with 404 (a miss), a missing or revoked key with 401
 * (`auth_failed`), and its rate limit with 429 (the generic range mapping).
 */
export function classifyTmdbError(error: unknown): RequestOutcome {
	if (error instanceof TmdbPayloadMismatchError) {
		return { outcome: 'error', reason: 'invalid_response' };
	}
	return classifyProviderRequestError(error, {
		statusOutcomes: { 401: 'auth_failed', 404: 'miss' },
	});
}
