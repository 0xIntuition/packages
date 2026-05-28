import { describe, expect, it } from 'vitest';
import * as trust from './index';

describe('core/trust index exports', () => {
	it('exports trust helpers', () => {
		expect(typeof trust.trustAllowance).toBe('function');
		expect(typeof trust.trustApprove).toBe('function');
		expect(typeof trust.trustBalanceOf).toBe('function');
		expect(typeof trust.trustTotalSupply).toBe('function');
		expect(typeof trust.trustTransfer).toBe('function');
		expect(typeof trust.trustTransferFrom).toBe('function');
	});
});
