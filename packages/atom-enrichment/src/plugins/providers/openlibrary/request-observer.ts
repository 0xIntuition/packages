import type { OpenLibraryEnrichmentOperation } from '@0xintuition/pipeline-runtime/provider-registry';
import type {
	ObservedRequestContext,
	RequestOutcome,
} from '@0xintuition/pipeline-runtime/provider-request-observation';
import { observeSlottedProviderRequest } from '@0xintuition/pipeline-runtime/provider-request-observation';
import type { RequestSlot } from '@0xintuition/pipeline-runtime/request-slot';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';

export type { ObservedRequestContext };

export type OpenLibraryOperation = OpenLibraryEnrichmentOperation;

export function entityOperation(path: string): OpenLibraryOperation {
	if (path.startsWith('/books/')) return 'book';
	if (path.startsWith('/isbn/')) return 'isbn';
	return 'work';
}

/** A 404 from OpenLibrary is a miss: the work, edition or ISBN does not exist. */
export function classifyRequestError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, { statusOutcomes: { 404: 'miss' } });
}

/**
 * Runs one OpenLibrary request through the process-wide slot and reports it. The abort,
 * deadline and slot rules are the shared ones in `provider-request-observation`: the
 * observation starts at enqueue and the duration is measured from the dial. A slot refusal
 * (queue full, or it cannot start before the deadline) and the engine deadline firing while the
 * request still waits for its turn are `budget_exhausted` with no duration (ENG-17085); a
 * deadline passing after the dial is a `timeout`; a caller cancel records nothing.
 */
export async function observeRequest<T>(
	slot: RequestSlot,
	operation: OpenLibraryOperation,
	context: ObservedRequestContext,
	request: (signal: AbortSignal) => Promise<T>
): Promise<T> {
	return await observeSlottedProviderRequest(
		{ provider: 'openlibrary', operation, context, classifyError: classifyRequestError },
		slot,
		request
	);
}
