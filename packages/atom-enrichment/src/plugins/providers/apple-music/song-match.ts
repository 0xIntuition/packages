/**
 * Match gate for gated iTunes song-catalog searches (ENG-13713 round 4).
 *
 * Term searches are inherently fuzzy — unlike ISRC joins there is no exact
 * recording id — so a candidate is only accepted when title AND artist
 * corroborate and, when the caller knows the recording length, the duration
 * agrees within a tight tolerance. Shared between the apple-music plugin's
 * candidate selection and the tRPC track-preview resolver's re-check so both
 * gates apply identical semantics. Blank beats wrong.
 */

/** iTunes trackTimeMillis must agree with a known duration within ±10s. */
export const SONG_DURATION_TOLERANCE_MS = 10_000;

// "(Remastered 2011)" / "[feat. X]" — iTunes' parenthetical qualifier style.
const BRACKETED_SEGMENT_PATTERN = /[([][^)\]]*[)\]]/g;

// "Title - 2011 Remaster" / "Title - Live" — Spotify's dash-suffix qualifier
// style. Everything from the first " - " on is treated as qualifier noise;
// the containment fallback plus the artist and duration axes protect the
// rare title that legitimately contains " - ".
const DASH_QUALIFIER_PATTERN = /\s-\s.*$/;

/**
 * The shared normalize core: lowercases, folds diacritics (NFKD), and collapses
 * every run of non-alphanumerics to a single space (which also trims). The
 * podcast gate (`normalizeGateText`) uses this directly; the song gate strips
 * bracket/dash qualifier noise before applying it. Qualifier stripping is
 * case-insensitive (brackets and " - " are ASCII), so running it on the raw
 * value before this lowercases is byte-identical to the previous inline order.
 */
export function baseNormalizeMatchText(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

/**
 * Lowercases, strips bracketed and dash-suffix qualifier noise
 * (remaster/feat./live variants), folds diacritics, and collapses all
 * remaining punctuation to single spaces.
 */
export function normalizeSongMatchText(value: string): string {
	return baseNormalizeMatchText(
		value.replace(BRACKETED_SEGMENT_PATTERN, ' ').replace(DASH_QUALIFIER_PATTERN, ' ')
	);
}

/**
 * True when both texts normalize non-empty and are equal or one contains the
 * other (Spotify and iTunes disagree on qualifier placement, "Artist A &
 * Artist B" vs "Artist A", etc.).
 */
export function songTextsMatch(left: string | undefined, right: string | undefined): boolean {
	if (!(left && right)) {
		return false;
	}
	const normalizedLeft = normalizeSongMatchText(left);
	const normalizedRight = normalizeSongMatchText(right);
	if (!(normalizedLeft && normalizedRight)) {
		return false;
	}

	return (
		normalizedLeft === normalizedRight ||
		normalizedLeft.includes(normalizedRight) ||
		normalizedRight.includes(normalizedLeft)
	);
}

/**
 * True when no expected duration is known (the axis does not apply), false
 * when one is known but the candidate has none — an unverifiable candidate
 * must not pass a gate whose point is never attaching the wrong recording.
 */
export function songDurationsMatch(
	candidateMs: number | undefined,
	expectedMs: number | undefined
): boolean {
	if (expectedMs === undefined) {
		return true;
	}
	if (candidateMs === undefined) {
		return false;
	}

	return Math.abs(candidateMs - expectedMs) <= SONG_DURATION_TOLERANCE_MS;
}
