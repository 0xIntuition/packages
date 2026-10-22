import { formatEther, type Hex } from 'viem';

export function formatCompactHex(value: Hex, leadingChars = 8, trailingChars = 6): string {
	const safeLeadingChars = Math.max(2, leadingChars);
	const safeTrailingChars = Math.max(0, trailingChars);

	if (value.length <= safeLeadingChars + safeTrailingChars) {
		return value;
	}

	if (safeTrailingChars === 0) {
		return `${value.slice(0, safeLeadingChars)}...`;
	}

	return `${value.slice(0, safeLeadingChars)}...${value.slice(-safeTrailingChars)}`;
}

export type TrustAmountInput = bigint | number | string | null | undefined;

export function formatTrustValue(
	value: TrustAmountInput,
	options: Intl.NumberFormatOptions = {}
): string {
	const amount = trustAmountToNumber(value);
	if (amount === null) {
		return 'N/A';
	}

	return new Intl.NumberFormat('en-US', {
		compactDisplay: 'short',
		maximumFractionDigits: 1,
		notation: 'compact',
		...options,
	}).format(amount);
}

function trustAmountToNumber(value: TrustAmountInput): number | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}
	if (typeof value === 'bigint') {
		return Number(formatEther(value));
	}

	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}
	if (trimmed.includes('.')) {
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : null;
	}

	try {
		return Number(formatEther(BigInt(trimmed)));
	} catch {
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : null;
	}
}
