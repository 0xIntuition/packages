import { describe, it } from 'vitest';
import { assertEncoderRoundTrip } from './encoders.test-helpers';
import * as metaBridge from './meta-bridge';
import { metaBridgeEncoderManifest } from './meta-bridge/manifest';

describe('periphery meta-bridge encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(metaBridge as Record<string, unknown>, metaBridgeEncoderManifest);
	});
});
