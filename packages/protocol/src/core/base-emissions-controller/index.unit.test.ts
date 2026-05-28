import { describe, expect, it } from 'vitest';

import * as baseEmissionsController from './index';

describe('core/base-emissions-controller index exports', () => {
	it('exports base emissions read helpers', () => {
		expect(typeof baseEmissionsController.baseEmissionsControllerGetBalance).toBe('function');
		expect(typeof baseEmissionsController.baseEmissionsControllerGetTrustToken).toBe('function');
		expect(typeof baseEmissionsController.baseEmissionsControllerGetTotalMinted).toBe('function');
		expect(typeof baseEmissionsController.baseEmissionsControllerGetCurrentEpoch).toBe('function');
		expect(typeof baseEmissionsController.baseEmissionsControllerQuoteGasPayment).toBe('function');
	});
});
