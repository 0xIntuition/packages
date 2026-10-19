import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the EIP-712 `CLAIM_AUTHORIZATION_TYPEHASH` used by `claimWithAuthorization`. */
export async function atomWardenClaimAuthorizationTypehash(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'CLAIM_AUTHORIZATION_TYPEHASH',
	});
}
