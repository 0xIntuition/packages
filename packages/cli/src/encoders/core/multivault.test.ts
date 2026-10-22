import { describe, it } from 'vitest';
import { assertEncoderRoundTrip } from './encoders.test-helpers';
import * as multivault from './multivault';
import { multivaultEncoderManifest } from './multivault/manifest';

describe('core multivault encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(multivault as Record<string, unknown>, multivaultEncoderManifest);
	});
});
