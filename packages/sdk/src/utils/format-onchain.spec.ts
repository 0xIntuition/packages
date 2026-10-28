import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { formatCompactHex } from './format-onchain';

describe('format onchain utils', () => {
	it('compacts long hex values and leaves short values untouched', () => {
		const hash = `0x${'ab'.repeat(32)}` as Hex;
		expect(formatCompactHex(hash)).toBe('0xababab...ababab');
		expect(formatCompactHex('0x1234' as Hex)).toBe('0x1234');
	});
});
