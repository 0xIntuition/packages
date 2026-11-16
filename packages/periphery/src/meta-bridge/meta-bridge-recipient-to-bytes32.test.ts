import type { Address } from 'viem';
import { describe, expect, it } from 'vitest';

import { metaBridgeRecipientToBytes32 } from './meta-bridge-recipient-to-bytes32';

describe('metaBridgeRecipientToBytes32', () => {
	it('left-pads address to bytes32', () => {
		const recipient = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;

		expect(metaBridgeRecipientToBytes32(recipient)).toBe(
			'0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
		);
	});
});
