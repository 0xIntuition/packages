import { describe, it } from 'vitest';
import { assertEncoderRoundTrip } from './encoders.test-helpers';
import * as trustbonding from './trustbonding';
import { trustbondingEncoderManifest } from './trustbonding/manifest';

describe('core trustbonding encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(trustbonding as Record<string, unknown>, trustbondingEncoderManifest);
	});
});
