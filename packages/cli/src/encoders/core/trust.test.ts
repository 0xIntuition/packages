import { describe, it } from 'vitest';
import { assertEncoderRoundTrip } from './encoders.test-helpers';
import * as trust from './trust';
import { trustEncoderManifest } from './trust/manifest';

describe('core trust encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(trust as Record<string, unknown>, trustEncoderManifest);
	});
});
