import { describe, it } from 'vitest';
import * as multivault from './multivault';
import { multivaultEncoderManifest } from './multivault/manifest';
import { assertEncoderRoundTrip } from './test-helpers';

describe('core multivault encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(multivault as Record<string, unknown>, multivaultEncoderManifest);
	});
});
