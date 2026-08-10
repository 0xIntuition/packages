/**
 * NORM-1 string normalization (spec §4).
 *
 * Order matters and is frozen: NFKC → punctuation folding → case folding →
 * trim → whitespace collapse. Changing any rule forks every derived IID, so
 * changes ship as a new scheme version (`gen2`), never in place (spec §9.3).
 */

const APOSTROPHE_VARIANTS = /[‘’ʼ]/g;
const DOUBLE_QUOTE_VARIANTS = /[“”]/g;
const DASH_VARIANTS = /[–—−]/g;
const WHITESPACE_RUNS = /\s+/g;

/**
 * Full Unicode case folding diverges from `toLowerCase()` for a small set of
 * characters that expand or change shape when folded. NFKC (applied first)
 * already resolves compatibility forms (ligatures, full-width); these cover
 * the stable simple→full folding divergences relevant after NFKC.
 */
const CASE_FOLD_EXPANSIONS: readonly [RegExp, string][] = [
	[/ß/g, 'ss'], // ß LATIN SMALL LETTER SHARP S
	[/ẞ/g, 'ss'], // ẞ LATIN CAPITAL LETTER SHARP S
	[/ς/g, 'σ'], // ς GREEK SMALL LETTER FINAL SIGMA → σ
	[/İ/g, 'i̇'], // İ LATIN CAPITAL LETTER I WITH DOT ABOVE
];

function caseFold(input: string): string {
	let out = input.toLowerCase();

	for (const [pattern, replacement] of CASE_FOLD_EXPANSIONS) {
		out = out.replace(pattern, replacement);
	}

	return out;
}

/**
 * Fold Unicode punctuation variants that NFKC leaves untouched (spec §4.2).
 * Safe unlike diacritic folding: punctuation variants never distinguish
 * entities ("Don’t" vs "Don't" is the same title).
 */
function foldPunctuation(input: string): string {
	return input
		.replace(APOSTROPHE_VARIANTS, "'")
		.replace(DOUBLE_QUOTE_VARIANTS, '"')
		.replace(DASH_VARIANTS, '-');
}

/** Apply NORM-1 to a string value before it enters a gen1 preimage. */
export function norm1(input: string): string {
	return caseFold(foldPunctuation(input.normalize('NFKC')))
		.trim()
		.replace(WHITESPACE_RUNS, ' ');
}
