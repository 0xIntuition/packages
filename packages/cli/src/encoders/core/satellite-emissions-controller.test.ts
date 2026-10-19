import { describe, it } from 'vitest';
import * as satelliteEmissionsController from './satellite-emissions-controller';
import { satelliteEmissionsControllerEncoderManifest } from './satellite-emissions-controller/manifest';
import { assertEncoderRoundTrip } from './test-helpers';

describe('core satellite emissions controller encoders', () => {
	it('encodes and decodes all manifest entries', () => {
		assertEncoderRoundTrip(
			satelliteEmissionsController as Record<string, unknown>,
			satelliteEmissionsControllerEncoderManifest
		);
	});
});
