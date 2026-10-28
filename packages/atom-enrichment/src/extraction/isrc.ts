// ISRC (ISO 3901): 2-letter country, 3-char registrant, 2-digit year,
// 5-digit designation — serving providers (Spotify, Apple) emit it without the
// separators. Shared by the tRPC track-preview resolver and the
// providers that read ISRCs so the format rule lives in exactly one place.
const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i;

/** True when the trimmed value is a well-formed ISRC (case-insensitive). */
export function isValidIsrc(value: string | undefined | null): boolean {
	return Boolean(value && ISRC_PATTERN.test(value.trim()));
}

/**
 * Trims and uppercases an ISRC, returning undefined when it is missing or
 * malformed. The canonical way to read an ISRC anywhere it is used as a key or
 * match signal.
 */
export function normalizeIsrc(value: string | undefined | null): string | undefined {
	if (!value) {
		return undefined;
	}
	const normalized = value.trim().toUpperCase();
	return ISRC_PATTERN.test(normalized) ? normalized : undefined;
}
