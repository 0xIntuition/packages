import { encodeFunctionData } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import {
	type CreateAtomsWithUrisInputs,
	multiVaultValidateCreateAtomsWithUris,
} from './create-atoms-with-uris';

/** Encodes validated calldata for `createAtomsWithUris`. */
export function multiVaultCreateAtomsWithUrisEncode(inputs: CreateAtomsWithUrisInputs) {
	multiVaultValidateCreateAtomsWithUris(inputs);
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'createAtomsWithUris',
		args: inputs.args,
	});
}
