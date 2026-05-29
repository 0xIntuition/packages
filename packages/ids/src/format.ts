import type { Hex } from 'viem';
import { formatEther, getAddress, isAddress } from 'viem';

/**
 * Shorten a hex string for display by keeping leading and trailing characters.
 *
 * Returns the full value when it is shorter than `leadingChars + trailingChars`.
 *
 * @param value - The hex string to shorten.
 * @param leadingChars - Number of leading characters to keep (minimum 2 for the `0x` prefix). Defaults to 8.
 * @param trailingChars - Number of trailing characters to keep. Defaults to 6. Pass 0 for no trailing portion.
 * @returns The shortened hex string with `...` in the middle, or the original if short enough.
 *
 * @example
 * ```ts
 * shortenHex('0xababababababababababababababababababababababababababababababababab')
 * // '0xababab...ababab'
 *
 * shortenHex('0x1234')
 * // '0x1234'
 * ```
 */
export function shortenHex(value: Hex, leadingChars = 8, trailingChars = 6): string {
	const safeLeading = Math.max(2, leadingChars);
	const safeTrailing = Math.max(0, trailingChars);

	if (value.length <= safeLeading + safeTrailing) {
		return value;
	}

	if (safeTrailing === 0) {
		return `${value.slice(0, safeLeading)}...`;
	}

	return `${value.slice(0, safeLeading)}...${value.slice(-safeTrailing)}`;
}

/**
 * Format a bigint value denominated in wei as an ether string with thousands separators.
 *
 * Trailing zeros are trimmed from the fractional part. The result is suitable
 * for display in UIs showing ETH-denominated trust amounts.
 *
 * @param value - The value in wei.
 * @param maximumFractionDigits - Maximum number of fractional digits to display. Defaults to 6.
 * @returns A formatted string with thousands separators and trimmed fractions.
 *
 * @example
 * ```ts
 * formatTrustAmount(12_345_678_901_234_567_890_123n)
 * // '12,345.678901'
 *
 * formatTrustAmount(10_000_000_000_000_000_000n)
 * // '10'
 * ```
 */
export function formatTrustAmount(value: bigint, maximumFractionDigits = 6): string {
	const [wholeRaw = '0', fractionRaw = ''] = formatEther(value).split('.');
	const whole = addThousandsSeparators(wholeRaw);
	const safeFractionDigits = Math.max(0, maximumFractionDigits);
	const trimmedFraction = fractionRaw.replace(/0+$/, '').slice(0, safeFractionDigits);
	return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

/**
 * Checksum an Ethereum address using EIP-55 mixed-case encoding.
 *
 * Returns the checksummed address, or `undefined` if the input is not a valid address.
 *
 * @param address - A hex string that may be an Ethereum address.
 * @returns The checksummed address, or `undefined` for invalid inputs.
 *
 * @example
 * ```ts
 * checksumAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
 * // '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 *
 * checksumAddress('0xinvalid')
 * // undefined
 * ```
 */
export function checksumAddress(address: string): string | undefined {
	if (!isAddress(address, { strict: false })) {
		return undefined;
	}
	return getAddress(address);
}

function addThousandsSeparators(value: string): string {
	const sign = value.startsWith('-') ? '-' : '';
	const unsigned = sign ? value.slice(1) : value;
	return `${sign}${unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
