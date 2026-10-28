/**
 * Shared error vocabulary for pipeline stages that must degrade without
 * discarding why a stage failed. Domain packages may add structured details,
 * but must reuse one of these stable kinds at their public boundary.
 */
export const PIPELINE_ERROR_KINDS = [
	'circuit_open',
	'dns_failure',
	'ssrf_rejected',
	'embargoed_host',
	'timeout',
	'redirect_exhausted',
	'non_ok_status',
	'waf_challenge',
	'http_error',
	'body_read_failure',
	'body_limit',
	'identity_conflict',
	'redirect_rejected',
	'parse_failure',
	'adapter_error',
	'adapter_null',
] as const;

export type PipelineErrorKind = (typeof PIPELINE_ERROR_KINDS)[number];

export function isPipelineErrorKind(value: unknown): value is PipelineErrorKind {
	return PIPELINE_ERROR_KINDS.includes(value as PipelineErrorKind);
}
