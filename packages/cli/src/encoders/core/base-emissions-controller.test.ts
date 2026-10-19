import { describe, it } from 'vitest';
import * as baseEmissionsController from './base-emissions-controller';
import { baseEmissionsControllerEncoderManifest } from './base-emissions-controller/manifest';
import { assertEncoderRoundTrip } from './test-helpers';

describe('core base emissions controller encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(
			baseEmissionsController as Record<string, unknown>,
			baseEmissionsControllerEncoderManifest
		);
	});
});
