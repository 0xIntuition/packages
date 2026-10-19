import { describe, it } from 'vitest';
import { assertEncoderRoundTrip } from './test-helpers';
import * as trustSwapAndBridgeRouter from './trust-swap-and-bridge-router';
import { trustSwapAndBridgeRouterEncoderManifest } from './trust-swap-and-bridge-router/manifest';

describe('periphery trust-swap-and-bridge-router encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(
			trustSwapAndBridgeRouter as Record<string, unknown>,
			trustSwapAndBridgeRouterEncoderManifest
		);
	});
});
