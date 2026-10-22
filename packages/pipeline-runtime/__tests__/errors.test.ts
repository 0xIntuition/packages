import { describe, expect, it } from 'vitest';

import { isPipelineErrorKind, PIPELINE_ERROR_KINDS } from '../src/errors';

describe('pipeline error vocabulary', () => {
	it('keeps stage failure kinds unified and enumerable', () => {
		expect(PIPELINE_ERROR_KINDS).toEqual([
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
		]);
		expect(PIPELINE_ERROR_KINDS.every(isPipelineErrorKind)).toBe(true);
		expect(isPipelineErrorKind('circuit_open')).toBe(true);
		expect(isPipelineErrorKind('classification-local-error')).toBe(false);
	});
});
