import { describe, it } from 'vitest';
import * as feeProxy from './fee-proxy';
import { feeProxyEncoderManifest } from './fee-proxy/manifest';
import { assertEncoderRoundTrip } from './test-helpers';

describe('periphery fee-proxy encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(feeProxy as Record<string, unknown>, feeProxyEncoderManifest);
	});
});
