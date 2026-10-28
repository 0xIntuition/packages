import { describe, it } from 'vitest';
import { assertEncoderRoundTrip } from './encoders.test-helpers';
import * as wrappedTrust from './wrapped-trust';
import { wrappedTrustEncoderManifest } from './wrapped-trust/manifest';

describe('core wrapped trust encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(wrappedTrust as Record<string, unknown>, wrappedTrustEncoderManifest);
	});
});
