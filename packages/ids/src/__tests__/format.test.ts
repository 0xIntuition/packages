import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { checksumAddress, formatTrustAmount, shortenHex } from '../format';

describe('shortenHex', () => {
	const longHash = `0x${'ab'.repeat(32)}` as Hex;

	it('shortens a long hex string with default params', () => {
		expect(shortenHex(longHash)).toBe('0xababab...ababab');
	});

	it('leaves a short hex string untouched', () => {
		expect(shortenHex('0x1234' as Hex)).toBe('0x1234');
	});

	it('supports custom leading and trailing counts', () => {
		expect(shortenHex(longHash, 6, 4)).toBe('0xabab...abab');
	});

	it('handles zero trailing chars', () => {
		expect(shortenHex(longHash, 8, 0)).toBe('0xababab...');
	});

	it('clamps leading chars to minimum of 2', () => {
		expect(shortenHex(longHash, 0, 6)).toBe('0x...ababab');
	});
});

describe('formatTrustAmount', () => {
	it('formats with thousands separators and capped fractions', () => {
		expect(formatTrustAmount(12_345_678_901_234_567_890_123n)).toBe('12,345.678901');
	});

	it('omits the fractional part when it is all zeros', () => {
		expect(formatTrustAmount(10_000_000_000_000_000_000n)).toBe('10');
	});

	it('respects a custom maximum fraction digits', () => {
		expect(formatTrustAmount(1_234_567_890_000_000_000_000n, 2)).toBe('1,234.56');
	});

	it('supports zero maximum fraction digits', () => {
		expect(formatTrustAmount(1_234_567_890_000_000_000_000n, 0)).toBe('1,234');
	});

	it('formats zero correctly', () => {
		expect(formatTrustAmount(0n)).toBe('0');
	});
});

describe('checksumAddress', () => {
	it('checksums a valid lowercase address', () => {
		const result = checksumAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
		expect(result).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
	});

	it('returns the same result for an already-checksummed address', () => {
		const checksummed = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
		expect(checksumAddress(checksummed)).toBe(checksummed);
	});

	it('returns undefined for an invalid address', () => {
		expect(checksumAddress('0xinvalid')).toBeUndefined();
		expect(checksumAddress('not-an-address')).toBeUndefined();
	});

	it('returns undefined for a too-short hex string', () => {
		expect(checksumAddress('0x1234')).toBeUndefined();
	});
});
