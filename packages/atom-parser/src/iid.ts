import {
	formatIntuitionId,
	getScheme,
	isAnchorEligible,
	parseIntuitionId,
	validateIntuitionId,
} from '@0xintuition/iid';
import type { IidInvalidReason, IidParseResult } from './types.js';

export type IidCandidate = Pick<
	IidParseResult,
	'valid' | 'scheme' | 'value' | 'canonicalIid' | 'anchorEligible' | 'reason'
>;

export function parseIidCandidate(input: string): IidCandidate | undefined {
	const normalized = normalizeIidCasing(input);
	if (normalized === undefined) {
		return undefined;
	}

	const parsed = parseIntuitionId(normalized);
	if (!parsed) {
		return invalidCandidate(normalized, 'unknown_or_malformed_iid');
	}

	const canonicalValue = getScheme(parsed.scheme)?.canonicalize(parsed.value);
	if (!canonicalValue) {
		return invalidCandidate(normalized, 'invalid_iid_value', parsed.scheme, parsed.value);
	}

	const canonicalIid = formatIntuitionId(parsed.scheme, canonicalValue);
	if (!validateIntuitionId(canonicalIid)) {
		return invalidCandidate(normalized, 'canonicalization_failed', parsed.scheme, parsed.value);
	}

	return {
		valid: true,
		scheme: parsed.scheme,
		value: canonicalValue,
		canonicalIid,
		anchorEligible: isAnchorEligible(canonicalIid),
	};
}

function invalidCandidate(
	input: string,
	reason: IidInvalidReason,
	knownScheme?: string,
	knownValue?: string
): IidCandidate {
	const fallback = splitIidParts(input);
	return {
		valid: false,
		scheme: knownScheme ?? fallback.scheme,
		value: knownValue ?? fallback.value,
		canonicalIid: null,
		anchorEligible: false,
		reason,
	};
}

function normalizeIidCasing(input: string): string | undefined {
	if (!/^int:/i.test(input)) {
		return undefined;
	}

	const payload = input.slice('int:'.length);
	const valueSeparator = payload.indexOf(':');
	const scheme = valueSeparator === -1 ? payload : payload.slice(0, valueSeparator);
	const rest = valueSeparator === -1 ? '' : payload.slice(valueSeparator);
	return `int:${scheme.toLowerCase()}${rest}`;
}

function splitIidParts(input: string): { scheme: string; value: string } {
	const payload = input.slice('int:'.length);
	const valueSeparator = payload.indexOf(':');
	if (valueSeparator === -1) {
		return { scheme: payload, value: '' };
	}

	return {
		scheme: payload.slice(0, valueSeparator),
		value: payload.slice(valueSeparator + 1),
	};
}
