import { type Address, encodeFunctionData, type Hex } from 'viem';
import { MultiVaultAbi } from '../../contracts';
import {
	type CreateAtomsWithUrisInputs,
	multiVaultValidateCreateAtomsWithUris,
} from './create-atoms-with-uris';

/** Encodes validated calldata; the object form also validates explicit value and optional URI limits. */
export function multiVaultCreateAtomsWithUrisEncode(inputs: CreateAtomsWithUrisInputs): Hex;
export function multiVaultCreateAtomsWithUrisEncode(
	creator: Address,
	data: Hex[],
	assets: bigint[],
	uris: Hex[][]
): Hex;
export function multiVaultCreateAtomsWithUrisEncode(
	...parameters: [CreateAtomsWithUrisInputs] | [Address, Hex[], bigint[], Hex[][]]
): Hex {
	const inputs: CreateAtomsWithUrisInputs =
		parameters.length === 1
			? parameters[0]
			: { args: parameters, value: parameters[2].reduce((sum, amount) => sum + amount, 0n) };
	multiVaultValidateCreateAtomsWithUris(inputs);
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'createAtomsWithUris',
		args: inputs.args,
	});
}
