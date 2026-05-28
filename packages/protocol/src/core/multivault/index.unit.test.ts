import { describe, expect, it } from 'vitest';

import * as multiVault from './index';

describe('core/multivault index exports', () => {
	it('exports core read and write helpers', () => {
		expect(typeof multiVault.multiVaultCreateAtoms).toBe('function');
		expect(typeof multiVault.multiVaultDeposit).toBe('function');
		expect(typeof multiVault.multiVaultRedeem).toBe('function');
		expect(typeof multiVault.multiVaultGetAtom).toBe('function');
		expect(typeof multiVault.multiVaultGetTriple).toBe('function');
		expect(typeof multiVault.multiVaultCurrentEpoch).toBe('function');
		expect(typeof multiVault.multiVaultApprove).toBe('function');
		expect(typeof multiVault.multiVaultPreviewTripleCreate).toBe('function');
		expect(typeof multiVault.multiVaultComputeAtomWalletAddr).toBe('function');
		expect(typeof multiVault.multiVaultResolveDefaultCurveId).toBe('function');
		expect(typeof multiVault.multiVaultResolveVaultTotals).toBe('function');
	});
});
