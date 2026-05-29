import { describe, expect, it } from 'vitest';

import * as wrappedTrust from './index';

describe('core/wrapped-trust index exports', () => {
	it('exports wrapped trust helpers', () => {
		expect(typeof wrappedTrust.wrappedTrustDeposit).toBe('function');
		expect(typeof wrappedTrust.wrappedTrustWithdraw).toBe('function');
		expect(typeof wrappedTrust.wrappedTrustApprove).toBe('function');
		expect(typeof wrappedTrust.wrappedTrustAllowance).toBe('function');
		expect(typeof wrappedTrust.wrappedTrustTransfer).toBe('function');
		expect(typeof wrappedTrust.wrappedTrustTransferFrom).toBe('function');
		expect(typeof wrappedTrust.wrappedTrustTotalSupply).toBe('function');
	});
});
