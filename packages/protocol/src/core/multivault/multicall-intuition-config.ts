import { type Address, formatUnits, type PublicClient } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { MultivaultConfig } from '../../types';

export type MultiCallIntuitionConfigs = {
	address: Address;
	publicClient: PublicClient;
};

const DEFAULT_MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as Address;

/**
 * Fetches and formats multiple MultiVault configuration values via multicall.
 * @param config Contract address and public client.
 * @returns Aggregated configuration values with raw and formatted fields.
 */
export async function multiVaultMultiCallIntuitionConfigs(config: MultiCallIntuitionConfigs) {
	const { address, publicClient } = config;
	const multicallAddress = publicClient.chain?.contracts?.multicall3?.address
		? publicClient.chain.contracts.multicall3.address
		: DEFAULT_MULTICALL3_ADDRESS;

	const wagmiContract = {
		address,
		abi: MultiVaultAbi,
	} as const;

	const contracts = [
		{
			...wagmiContract,
			functionName: 'getAtomCost',
			args: [],
		},
		{
			...wagmiContract,
			functionName: 'getTripleCost',
			args: [],
		},
		{
			...wagmiContract,
			functionName: 'atomConfig',
			args: [],
		},
		{
			...wagmiContract,
			functionName: 'tripleConfig',
			args: [],
		},
		{
			...wagmiContract,
			functionName: 'vaultFees',
			args: [],
		},
		{
			...wagmiContract,
			functionName: 'generalConfig',
			args: [],
		},
	] as const;

	const multicallResults = await publicClient.multicall({
		multicallAddress,
		contracts,
	});

	const multicallSucceeded = multicallResults.every((result) => result.status === 'success');

	const rawResults = multicallSucceeded
		? multicallResults.map((result) => result.result)
		: await Promise.all(
				contracts.map((contract) =>
					publicClient.readContract({
						address: contract.address,
						abi: contract.abi,
						functionName: contract.functionName as never,
						args: contract.args as never,
					})
				)
			);

	const atomCost = rawResults[0] as bigint;
	const formattedAtomCost = formatUnits(atomCost, 18);

	const tripleCost = rawResults[1] as bigint;
	const formattedTripleCost = formatUnits(tripleCost, 18);

	const atomConfig = rawResults[2] as readonly bigint[];
	const atomWalletInitialDepositAmount = atomConfig[0] as bigint;
	const formattedAtomWalletInitialDepositAmount = formatUnits(atomWalletInitialDepositAmount, 18);

	const atomCreationProtocolFee = atomConfig[1] as bigint;
	const formattedAtomCreationProtocolFee = formatUnits(atomCreationProtocolFee, 18);

	const tripleConfig = rawResults[3] as readonly bigint[];
	const tripleCreationProtocolFee = tripleConfig[0] as bigint;
	const formattedTripleCreationProtocolFee = formatUnits(tripleCreationProtocolFee, 18);

	const atomDepositFractionOnTripleCreation = tripleConfig[1] as bigint;
	const formattedAtomDepositFractionOnTripleCreation = formatUnits(
		atomDepositFractionOnTripleCreation,
		18
	);

	const vaultFees = rawResults[4] as readonly bigint[];
	const entryFee = vaultFees[0] as bigint;
	const formattedEntryFee = formatUnits(entryFee, 18);

	const exitFee = vaultFees[1] as bigint;
	const formattedExitFee = formatUnits(exitFee, 18);

	const protocolFee = vaultFees[2] as bigint;
	const formattedProtocolFee = formatUnits(protocolFee, 18);

	const generalConfig = rawResults[5] as readonly bigint[];
	const feeDenominator = generalConfig[2] as bigint;
	const formattedFeeDenominator = formatUnits(feeDenominator, 18);

	const minDeposit = generalConfig[4] as bigint;
	const formattedMinDeposit = formatUnits(minDeposit, 18);

	return {
		atom_cost: atomCost.toString(),
		formatted_atom_cost: formattedAtomCost,
		triple_cost: tripleCost.toString(),
		formatted_triple_cost: formattedTripleCost,
		atom_wallet_initial_deposit_amount: atomWalletInitialDepositAmount.toString(),
		formatted_atom_wallet_initial_deposit_amount: formattedAtomWalletInitialDepositAmount,
		atom_creation_protocol_fee: atomCreationProtocolFee.toString(),
		formatted_atom_creation_protocol_fee: formattedAtomCreationProtocolFee,
		triple_creation_protocol_fee: tripleCreationProtocolFee.toString(),
		formatted_triple_creation_protocol_fee: formattedTripleCreationProtocolFee,
		atom_deposit_fraction_on_triple_creation: atomDepositFractionOnTripleCreation.toString(),
		formatted_atom_deposit_fraction_on_triple_creation:
			formattedAtomDepositFractionOnTripleCreation,
		entry_fee: entryFee.toString(),
		formatted_entry_fee: formattedEntryFee,
		exit_fee: exitFee.toString(),
		formatted_exit_fee: formattedExitFee,
		protocol_fee: protocolFee.toString(),
		formatted_protocol_fee: formattedProtocolFee,
		fee_denominator: feeDenominator.toString(),
		formatted_fee_denominator: formattedFeeDenominator,
		min_deposit: minDeposit.toString(),
		formatted_min_deposit: formattedMinDeposit,
	} as MultivaultConfig;
}
