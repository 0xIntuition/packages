import { describe, expect, it } from 'vitest';

import {
	eventParse,
	eventParseAtomConfigUpdate,
	eventParseAtomCreated,
	eventParseAtomWalletDepositFeeCollected,
	eventParseAtomWalletDepositFeesClaimed,
	eventParseBondingCurveConfigUpdated,
	eventParseDeposited,
	eventParseGeneralConfigUpdated,
	eventParsePersonalUtilizationAdded,
	eventParsePersonalUtilizationRemoved,
	eventParseProtocolFeeAccrued,
	eventParseRedeemed,
	eventParseSharePriceChanged,
	eventParseTotalUtilizationAdded,
	eventParseTotalUtilizationRemoved,
	eventParseTripleCreated,
	eventParseVaultFeesUpdated,
	eventParseWalletConfigUpdated,
	multiVaultCreateAtoms,
	multiVaultCreateAtomsEncode,
	multiVaultDeposit,
	multiVaultDepositBatch,
	multiVaultDepositBatchEncode,
	multiVaultDepositEncode,
	multiVaultRedeem,
	multiVaultRedeemBatch,
	multiVaultRedeemBatchEncode,
	multiVaultRedeemEncode,
} from './index.js';

// Named imports keep the 3.0.0 call surface visible to the compiler.
const legacyFunctions = [
	['multiVaultCreateAtoms', multiVaultCreateAtoms, 2],
	['multiVaultCreateAtomsEncode', multiVaultCreateAtomsEncode, 2],
	['multiVaultDeposit', multiVaultDeposit, 2],
	['multiVaultDepositEncode', multiVaultDepositEncode, 4],
	['multiVaultDepositBatch', multiVaultDepositBatch, 2],
	['multiVaultDepositBatchEncode', multiVaultDepositBatchEncode, 5],
	['multiVaultRedeem', multiVaultRedeem, 2],
	['multiVaultRedeemEncode', multiVaultRedeemEncode, 5],
	['multiVaultRedeemBatch', multiVaultRedeemBatch, 2],
	['multiVaultRedeemBatchEncode', multiVaultRedeemBatchEncode, 5],
	['eventParse', eventParse, 3],
	['eventParseAtomConfigUpdate', eventParseAtomConfigUpdate, 2],
	['eventParseAtomCreated', eventParseAtomCreated, 2],
	['eventParseAtomWalletDepositFeeCollected', eventParseAtomWalletDepositFeeCollected, 2],
	['eventParseAtomWalletDepositFeesClaimed', eventParseAtomWalletDepositFeesClaimed, 2],
	['eventParseBondingCurveConfigUpdated', eventParseBondingCurveConfigUpdated, 2],
	['eventParseDeposited', eventParseDeposited, 2],
	['eventParseGeneralConfigUpdated', eventParseGeneralConfigUpdated, 2],
	['eventParsePersonalUtilizationAdded', eventParsePersonalUtilizationAdded, 2],
	['eventParsePersonalUtilizationRemoved', eventParsePersonalUtilizationRemoved, 2],
	['eventParseProtocolFeeAccrued', eventParseProtocolFeeAccrued, 2],
	['eventParseRedeemed', eventParseRedeemed, 2],
	['eventParseSharePriceChanged', eventParseSharePriceChanged, 2],
	['eventParseTotalUtilizationAdded', eventParseTotalUtilizationAdded, 2],
	['eventParseTotalUtilizationRemoved', eventParseTotalUtilizationRemoved, 2],
	['eventParseTripleCreated', eventParseTripleCreated, 2],
	['eventParseVaultFeesUpdated', eventParseVaultFeesUpdated, 2],
	['eventParseWalletConfigUpdated', eventParseWalletConfigUpdated, 2],
] as const;

describe('3.0.0 legacy public surface', () => {
	it.each(legacyFunctions)('%s retains arity %s', (_name, helper, arity) => {
		expect(helper).toBeTypeOf('function');
		expect(helper.length).toBe(arity);
	});
});
