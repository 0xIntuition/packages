import { describe, it } from 'vitest';
import * as dynamicFeeFlatPriceCurve from './dynamic-fee-flat-price-curve';
import { dynamicFeeFlatPriceCurveEncoderManifest } from './dynamic-fee-flat-price-curve/manifest';
import { assertEncoderRoundTrip } from './test-helpers';

describe('core dynamic-fee-flat-price-curve encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(
			dynamicFeeFlatPriceCurve as Record<string, unknown>,
			dynamicFeeFlatPriceCurveEncoderManifest
		);
	});
});
