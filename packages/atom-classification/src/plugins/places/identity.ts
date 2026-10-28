import { slugify } from '../shared/helpers';

const DEFAULT_PLACES_TITLE = 'Google Maps Place';
const MAX_PLACES_TITLE_LENGTH = 512;
const PLACE_URL_PATTERN = /(?:^|\/)place\/([^/]+)/;

export function buildPlacesCanonicalId(canonicalUrl: string): string {
	const urlSlug = slugify(canonicalUrl);
	if (urlSlug.length <= MAX_PLACES_ID_SLUG_LENGTH) {
		return `places:${urlSlug}`;
	}

	return `places:${urlSlug.slice(0, MAX_PLACES_ID_SLUG_LENGTH)}-${stableUrlHash(canonicalUrl)}`;
}

export function buildPlacesStableTitle(canonicalUrl: string): string {
	let pathname: string;
	try {
		pathname = new URL(canonicalUrl).pathname;
	} catch {
		return DEFAULT_PLACES_TITLE;
	}

	const raw = PLACE_URL_PATTERN.exec(pathname)?.[1];
	if (!raw) {
		return DEFAULT_PLACES_TITLE;
	}

	try {
		return decodePlaceName(raw) ?? DEFAULT_PLACES_TITLE;
	} catch {
		return decodePlaceName(raw, false) ?? DEFAULT_PLACES_TITLE;
	}
}

function decodePlaceName(raw: string, decode = true): string | undefined {
	const value = decode ? decodeURIComponent(raw) : raw;
	const normalized = value.replace(/\+/g, ' ').trim();
	if (normalized.length === 0) {
		return undefined;
	}

	const bounded = normalized.slice(0, MAX_PLACES_TITLE_LENGTH);
	const lastCodeUnit = bounded.charCodeAt(bounded.length - 1);
	return lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff ? bounded.slice(0, -1) : bounded;
}

function stableUrlHash(value: string): string {
	let first = 0x811c_9dc5;
	let second = 0x9e37_79b9;
	for (const character of value) {
		const codePoint = character.codePointAt(0) ?? 0;
		first = Math.imul(first ^ codePoint, 0x0100_0193);
		second = Math.imul(second ^ codePoint, 0x85eb_ca6b);
	}

	return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

const MAX_PLACES_ID_SLUG_LENGTH = 200;
