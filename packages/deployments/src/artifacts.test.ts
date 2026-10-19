import { describe, expect, it } from 'vitest';

import * as bytecode from './bytecode/index';
import * as root from './index';

// Pins the published artifact set, so adding or dropping a contract is a deliberate change.
const ABI_EXPORTS = [
	'AtomWalletAbi',
	'AtomWalletFactoryAbi',
	'AtomWardenAbi',
	'BaseEmissionsControllerAbi',
	'BondingCurveRegistryAbi',
	'DynamicFeeFlatPriceCurveAbi',
	'FeeProxyAbi',
	'IBaseCurveAbi',
	'LinearCurveAbi',
	'MetaERC20HubAbi',
	'MetaERC20SpokeAbi',
	'MetaNativeSpokeAbi',
	'MultiVaultAbi',
	'MultiVaultBubbledErrorsAbi',
	'MultiVaultMigrationModeAbi',
	'MultiVaultWithRevertsAbi',
	'OffsetProgressiveCurveAbi',
	'SatelliteEmissionsControllerAbi',
	'TimelockControllerAbi',
	'TransparentUpgradeableProxyAbi',
	'TrustAbi',
	'TrustBondingAbi',
	'TrustSwapAndBridgeRouterAbi',
	'WrappedTrustAbi',
];

const BYTECODE_EXPORTS = [
	'AtomWalletBytecode',
	'AtomWalletFactoryBytecode',
	'AtomWardenBytecode',
	'BaseEmissionsControllerBytecode',
	'BeaconProxyBytecode',
	'BondingCurveRegistryBytecode',
	'DynamicFeeFlatPriceCurveBytecode',
	'FeeProxyBytecode',
	'LinearCurveBytecode',
	'MetaERC20HubBytecode',
	'MetaERC20SpokeBytecode',
	'MetaNativeSpokeBytecode',
	'MultiVaultBytecode',
	'MultiVaultMigrationModeBytecode',
	'OffsetProgressiveCurveBytecode',
	'SatelliteEmissionsControllerBytecode',
	'TimelockControllerBytecode',
	'TransparentUpgradeableProxyBytecode',
	'TrustBondingBytecode',
	'TrustBytecode',
	'TrustSwapAndBridgeRouterBytecode',
	'WrappedTrustBytecode',
];

describe('artifact set', () => {
	it('exports exactly the pinned ABIs from the root entry', () => {
		const abiEntries = Object.entries(root).filter(([name]) => name.endsWith('Abi'));
		expect(abiEntries.map(([name]) => name).sort()).toEqual(ABI_EXPORTS);
		for (const [, value] of abiEntries) {
			expect(Array.isArray(value)).toBe(true);
		}
	});

	it('keeps bytecode out of the root entry', () => {
		expect(Object.keys(root).filter((name) => name.endsWith('Bytecode'))).toEqual([]);
	});

	it('exports exactly the pinned bytecode from the bytecode entry', () => {
		expect(Object.keys(bytecode).sort()).toEqual(BYTECODE_EXPORTS);
		// Not strict hex: bytecode that links an external library (MultiVault) carries the
		// unlinked `__$…$__` placeholders.
		for (const value of Object.values(bytecode)) {
			expect(value).toMatch(/^0x[0-9a-f]/);
		}
	});
});
