import {
	emitProviderEvent,
	type ProviderRequestEvent,
	providerErrorReason,
} from '@0xintuition/pipeline-runtime/provider-observer';
import type {
	ProviderName,
	ProviderOperationOf,
} from '@0xintuition/pipeline-runtime/provider-registry';

/**
 * Observation of a classification lookup (ENG-16466, ENG-16976): one event per
 * logical lookup, after cache resolution. Lookups fold their errors into a
 * result instead of throwing, so this reads the result, not an exception.
 *
 * Observation only: it never throws, never changes a result and never dials.
 */
export type ObservableLookupResult =
	| { status: 'hit' | 'ambiguous' }
	| { status: 'miss'; budgetExhausted?: true }
	| { status: 'failure'; failure: { kind?: string; reason?: string; status?: number } };

/**
 * A lookup cancelled by its caller (a lost fallback race, an aborted preview)
 * says nothing about the provider and is not recorded.
 */
export function isCallerCancelledLookup(
	signal: AbortSignal | undefined,
	result: ObservableLookupResult
): boolean {
	return signal?.aborted === true && result.status === 'failure';
}

export function observeProviderLookup<P extends ProviderName>(input: {
	provider: P;
	operation: ProviderOperationOf<P>;
	result: ObservableLookupResult;
	source: ProviderRequestEvent['source'];
	/** Wall time of a live lookup. Ignored for a cache hit, which has no duration. */
	durationMs?: number;
}): void {
	const { provider, operation, result, source, durationMs } = input;
	const outcome: Pick<ProviderRequestEvent, 'outcome' | 'reason'> =
		result.status === 'failure'
			? { outcome: 'error', reason: providerErrorReason(result.failure) }
			: result.status === 'miss' && result.budgetExhausted
				? { outcome: 'budget_exhausted', reason: 'none' }
				: { outcome: result.status, reason: 'none' };
	// A cache hit and a budget miss never dialled: neither has a duration.
	const dialled = source === 'live' && outcome.outcome !== 'budget_exhausted';
	// TypeScript cannot correlate the generic pair with the event union; the input type did.
	emitProviderEvent({
		type: 'provider_request',
		provider,
		operation,
		...outcome,
		source,
		...(dialled && durationMs !== undefined ? { durationMs } : {}),
	} as ProviderRequestEvent);
}
