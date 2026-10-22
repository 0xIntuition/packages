import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { associateAtomCreationContext } from './atom-creation-context';

const termA = `0x${'aa'.repeat(32)}` as Hex;
const termB = `0x${'bb'.repeat(32)}` as Hex;
const registrant = '0x0000000000000000000000000000000000000001' as Address;

describe('associateAtomCreationContext', () => {
	it('joins by termId even when receipt events are out of order', () => {
		const atomEvents = [{ args: { termId: termA } }, { args: { termId: termB } }];
		const contextEvents = [
			{ args: { termId: termB, registrant, uris: ['0x02' as Hex] } },
			{ args: { termId: termA, registrant, uris: ['0x01' as Hex, '0x01' as Hex] } },
		];
		const result = associateAtomCreationContext(atomEvents, contextEvents);
		expect(result[0]?.contexts[0]?.args.uris).toEqual(['0x01', '0x01']);
		expect(result[1]?.contexts[0]?.args.uris).toEqual(['0x02']);
	});
});
