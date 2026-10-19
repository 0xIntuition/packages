import { describe, it } from 'vitest';
import * as metaBridge from './meta-bridge';
import { metaBridgeEncoderManifest } from './meta-bridge/manifest';
import { assertEncoderRoundTrip } from './test-helpers';

describe('periphery meta-bridge encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(metaBridge as Record<string, unknown>, metaBridgeEncoderManifest);
	});
});
