import { describe, expect, it } from 'vitest';

import * as satelliteEmissionsController from './index';

describe('core/satellite-emissions-controller index exports', () => {
	it('exports satellite emissions read helpers', () => {
		expect(typeof satelliteEmissionsController.satelliteEmissionsControllerGetTrustBonding).toBe(
			'function'
		);
		expect(
			typeof satelliteEmissionsController.satelliteEmissionsControllerGetBaseEmissionsController
		).toBe('function');
		expect(typeof satelliteEmissionsController.satelliteEmissionsControllerGetCurrentEpoch).toBe(
			'function'
		);
		expect(
			typeof satelliteEmissionsController.satelliteEmissionsControllerGetReclaimedEmissions
		).toBe('function');
		expect(typeof satelliteEmissionsController.satelliteEmissionsControllerQuoteGasPayment).toBe(
			'function'
		);
	});
});
