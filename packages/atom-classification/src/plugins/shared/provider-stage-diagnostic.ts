import {
	describeProviderFetchFailure,
	type ProviderFetchFailureContext,
} from '@0xintuition/atom-enrichment/provider-fetch';
import type { PipelineErrorKind } from '@0xintuition/pipeline-runtime/errors';
import { createPlatformStageDiagnostic } from './platform';

/**
 * A failed provider fetch (`fetchProviderJson`) as a domain-api stage diagnostic, the one mapper of
 * every provider adapter (Spotify, Wikidata, Wikipedia; ENG-17015): a
 * stable `PipelineErrorKind` and a label-safe message, a status (with `Retry-After` when the
 * provider sent one) or a fixed phrase naming the provider, never an id or the upstream text.
 */
export function toProviderStageDiagnostic(
	error: unknown,
	providerLabel: string,
	context?: ProviderFetchFailureContext
): Error & { readonly reason: PipelineErrorKind } {
	const failure = describeProviderFetchFailure(error, context);
	switch (failure.kind) {
		case 'non_ok_status':
			return createPlatformStageDiagnostic(
				'non_ok_status',
				`HTTP ${failure.status}${
					failure.retryAfterMs === undefined ? '' : ` (retryAfterMs=${failure.retryAfterMs})`
				}`
			);
		case 'redirect_rejected':
		case 'redirect_exhausted':
			return createPlatformStageDiagnostic(
				failure.kind,
				`${providerLabel} answered with a redirect`
			);
		case 'ssrf_rejected':
		case 'embargoed_host':
			return createPlatformStageDiagnostic('ssrf_rejected', `${providerLabel} target was rejected`);
		case 'parse_failure':
		case 'body_limit':
			return createPlatformStageDiagnostic(
				'parse_failure',
				`${providerLabel} response was invalid`
			);
		case 'timeout':
			return createPlatformStageDiagnostic('timeout', `${providerLabel} request timed out`);
		case 'cancelled':
			// Not a failure of the provider: the caller went away, so the generic kind.
			return createPlatformStageDiagnostic(
				'adapter_error',
				`${providerLabel} request was cancelled`
			);
		case 'dns_failure':
		case 'http_error':
			return createPlatformStageDiagnostic('http_error', `${providerLabel} request failed`);
	}
	// Exhaustive: a new `ProviderFetchFailureKind` fails to compile here.
	return failure.kind satisfies never;
}
