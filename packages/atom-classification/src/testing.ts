import { createRequestSlot, type RequestSlot } from '@0xintuition/pipeline-runtime/request-slot';

/**
 * Test-only resets for module-level state. Kept off the package's public entry:
 * production code must not be able to clear the host breakers or the lookup cache.
 */

export { resetDefaultWikidataIdentityBridgeForTests } from './identity-bridge';
export { resetDomainHtmlHostCircuitBreakersForTests } from './plugins/shared/domain-html/fetch';
export { resetOpenLibraryLookupCacheForTests } from './plugins/shared/openlibrary-lookup';

/**
 * A private Wikimedia request slot without spacing, for tests that drive the identity bridge: the
 * process-wide slot (`getWikimediaRequestSlot`) really waits 250 ms between requests.
 */
export function unspacedRequestSlot(): RequestSlot {
	return createRequestSlot({ minSpacingMs: 0 });
}
