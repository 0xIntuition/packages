import type { Abi } from 'viem';

import { BondingCurveRegistryAbi } from './BondingCurveRegistry-abi';
import { DynamicFeeFlatPriceCurveAbi } from './DynamicFeeFlatPriceCurve-abi';
import { IBaseCurveAbi } from './IBaseCurve-abi';
import { LinearCurveAbi } from './LinearCurve-abi';
import { MultiVaultAbi } from './MultiVault-abi';
import { OffsetProgressiveCurveAbi } from './OffsetProgressiveCurve-abi';

type AbiError = Extract<Abi[number], { type: 'error' }>;

function errorSignature(error: AbiError): string {
	return `${error.name}(${error.inputs.map((input) => input.type).join(',')})`;
}

const multiVaultErrorSignatures = new Set(
	MultiVaultAbi.filter((item) => item.type === 'error').map((item) =>
		errorSignature(item as AbiError)
	)
);

/**
 * Errors that MultiVault does not declare but lets bubble up from the contracts it calls: the
 * bonding-curve registry (e.g. `BondingCurveRegistry_InvalidCurveId` for an unknown curve id) and
 * every registered curve (`BaseCurve_*` bounds, the dynamic-fee curve's own errors, PRBMath
 * overflows from the progressive curves). Deduplicated by signature.
 */
export const MultiVaultBubbledErrorsAbi: readonly AbiError[] = (() => {
	const seen = new Set(multiVaultErrorSignatures);
	const bubbled: AbiError[] = [];
	for (const abi of [
		BondingCurveRegistryAbi,
		IBaseCurveAbi,
		LinearCurveAbi,
		OffsetProgressiveCurveAbi,
		DynamicFeeFlatPriceCurveAbi,
	]) {
		for (const item of abi) {
			if (item.type !== 'error') {
				continue;
			}
			const signature = errorSignature(item as AbiError);
			if (!seen.has(signature)) {
				seen.add(signature);
				bubbled.push(item as AbiError);
			}
		}
	}
	return bubbled;
})();

/**
 * The MultiVault ABI plus {@link MultiVaultBubbledErrorsAbi}. Use it wherever a MultiVault call
 * can revert inside a curve or the registry, so viem decodes those reverts by name instead of
 * reporting a bare selector.
 */
export const MultiVaultWithRevertsAbi: readonly [...typeof MultiVaultAbi, ...AbiError[]] = [
	...MultiVaultAbi,
	...MultiVaultBubbledErrorsAbi,
];
