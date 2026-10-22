import { describe, it } from 'vitest';
import * as atomWarden from './atom-warden';
import { atomWardenEncoderManifest } from './atom-warden/manifest';
import { assertEncoderRoundTrip } from './encoders.test-helpers';

describe('core atom-warden encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(atomWarden as Record<string, unknown>, atomWardenEncoderManifest);
	});
});
