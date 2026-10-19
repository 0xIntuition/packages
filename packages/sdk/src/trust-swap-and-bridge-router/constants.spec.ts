import { describe, expect, it } from 'vitest';

import { TRUST_TOKEN_ADDRESS, WTRUST_TOKEN_ADDRESS } from './constants';

// Both now come from @0xintuition/deployments; pin them so a map change cannot silently move
// the swap-and-bridge tokens.
describe('trust swap-and-bridge token addresses', () => {
	it('uses Trust on Base', () => {
		expect(TRUST_TOKEN_ADDRESS).toBe('0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3');
	});

	it('uses WrappedTrust on Intuition mainnet', () => {
		expect(WTRUST_TOKEN_ADDRESS).toBe('0x81cFb09cb44f7184Ad934C09F82000701A4bF672');
	});
});
