import type { ContractFunctionArgs } from 'viem';

import { BondingCurveRegistryAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Previews the assets a given curve would charge to mint `shares` against a vault at
 * `totalShares`/`totalAssets`. Used off-chain to derive the min-share bootstrap cost
 * MultiVault nets out of a vault's first-ever deposit (`previewMint(minShare, 0, 0, curveId)`).
 * @param config Contract address and public client.
 * @param inputs Function args for the shares/vault-state/curve lookup.
 * @returns The asset amount the curve would charge for those shares.
 */
export async function bondingCurveRegistryPreviewMint(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof BondingCurveRegistryAbi, 'view', 'previewMint'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: BondingCurveRegistryAbi,
		functionName: 'previewMint',
		args,
	});
}
