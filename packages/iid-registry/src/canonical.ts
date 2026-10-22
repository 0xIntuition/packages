import type { ParsedIid } from '@0xintuition/iid';
import { getScheme, parseIntuitionId } from '@0xintuition/iid';

/**
 * Parse an IID and canonicalize its value. Lenient on input, canonical on
 * output: a non-canonical but valid-grammar IID (permissionlessly
 * mintable, indexed as a cluster member, never quarantined) still resolves;
 * a value the scheme cannot canonicalize returns `undefined`.
 */
export function parseCanonical(iid: string): ParsedIid | undefined {
	const parsed = parseIntuitionId(iid);

	if (!parsed) {
		return undefined;
	}

	const canonicalValue = getScheme(parsed.scheme)?.canonicalize(parsed.value);

	if (canonicalValue === undefined) {
		return undefined;
	}

	return { scheme: parsed.scheme, value: canonicalValue };
}
