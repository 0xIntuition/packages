/**
 * The IID scheme registry (normative: `@0xintuition/iid-spec` schemes/).
 *
 * Every scheme's canonicalization is FROZEN once ratified (spec §9.3): a
 * rule change ships as a new scheme name, never an in-place edit. All
 * canonicalizers are pure and offline — no network I/O, ever.
 */
import { norm1 } from './norm.js';
import type { IdentityClass, SchemeDefinition, SchemeName } from './types.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const MBID_ENTITY_TYPES = new Set([
	'artist',
	'recording',
	'release',
	'release-group',
	'work',
	'label',
]);
const TMDB_ENTITY_TYPES = new Set(['movie', 'tv', 'person']);
const APP_STORES = new Set(['ios', 'android']);
const HASH_ALGORITHMS = new Set(['sha256', 'keccak256']);
// The freeze rule fixes canonicalization at first mint (spec §9.3) — additions must land before any
// `int:url:` atom exists. Ad-platform click IDs (gclid/dclid/wbraid/gbraid,
// fbclid, msclkid, twclid, ttclid), share/session tags (si, igshid, g_mp),
// and marketing-automation tokens (utm_*, mc_cid, mkt_tok, spm, ref).
const TRACKING_PARAM_PATTERN =
	/^(utm_|fbclid$|gclid$|dclid$|wbraid$|gbraid$|msclkid$|twclid$|ttclid$|igshid$|g_mp$|spm$|mkt_tok$|mc_cid$|ref$|si$)/;

function stripSeparators(raw: string): string {
	return raw.replace(/[-\s.]/g, '');
}

// --- check digits ---

function isbn10CheckDigit(core: string): string {
	let sum = 0;

	for (let i = 0; i < 9; i++) {
		sum += (10 - i) * Number(core[i]);
	}

	const check = (11 - (sum % 11)) % 11;
	return check === 10 ? 'X' : String(check);
}

function gs1CheckDigit(digits: string): number {
	// GS1 mod-10: from the RIGHT of the payload, weights alternate 3,1,3,...
	let sum = 0;

	for (let i = 0; i < digits.length; i++) {
		const digit = Number(digits[digits.length - 1 - i]);
		sum += digit * (i % 2 === 0 ? 3 : 1);
	}

	return (10 - (sum % 10)) % 10;
}

/** ISO 7064 mod 11-2 check character (ISNI, ORCID). */
function iso7064Mod11Dash2Check(digits: string): string {
	let total = 0;

	for (const ch of digits) {
		total = (total + Number(ch)) * 2;
	}

	const remainder = total % 11;
	const result = (12 - remainder) % 11;
	return result === 10 ? 'X' : String(result);
}

/** ISO 7064 mod 97-10 validation (LEI): letters map A=10..Z=35, mod 97 === 1. */
function iso7064Mod97Dash10IsValid(value: string): boolean {
	let remainder = 0;

	for (const ch of value) {
		const mapped = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);

		for (const digit of mapped) {
			remainder = (remainder * 10 + Number(digit)) % 97;
		}
	}

	return remainder === 1;
}

function iswcIsValid(value: string): boolean {
	// T + 9 digits + check digit; check = mod-10 over (1 + Σ position·digit).
	if (!/^T\d{10}$/.test(value)) {
		return false;
	}

	let sum = 1;

	for (let i = 0; i < 9; i++) {
		sum += (i + 1) * Number(value[i + 1]);
	}

	return (10 - (sum % 10)) % 10 === Number(value[10]);
}

// --- scheme canonicalizers ---

function canonicalizeIsbn(raw: string): string | undefined {
	const clean = stripSeparators(raw).toUpperCase();

	if (/^\d{9}[\dX]$/.test(clean)) {
		if (isbn10CheckDigit(clean) !== clean[9]) {
			return undefined;
		}

		const core = `978${clean.slice(0, 9)}`;
		return `${core}${gs1CheckDigit(core)}`;
	}

	if (/^\d{13}$/.test(clean)) {
		return gs1CheckDigit(clean.slice(0, 12)) === Number(clean[12]) ? clean : undefined;
	}

	return undefined;
}

function canonicalizeGtin(raw: string): string | undefined {
	const clean = stripSeparators(raw);

	if (!/^\d{8}$|^\d{12,14}$/.test(clean)) {
		return undefined;
	}

	const padded = clean.padStart(14, '0');
	return gs1CheckDigit(padded.slice(0, 13)) === Number(padded[13]) ? padded : undefined;
}

function canonicalizeIsrc(raw: string): string | undefined {
	const clean = stripSeparators(raw).toUpperCase();
	return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(clean) ? clean : undefined;
}

function canonicalizeIswc(raw: string): string | undefined {
	const clean = stripSeparators(raw).toUpperCase();
	return iswcIsValid(clean) ? clean : undefined;
}

function canonicalizeIsni(raw: string): string | undefined {
	const clean = stripSeparators(raw).toUpperCase();

	if (!/^\d{15}[\dX]$/.test(clean)) {
		return undefined;
	}

	return iso7064Mod11Dash2Check(clean.slice(0, 15)) === clean[15] ? clean : undefined;
}

function canonicalizeLei(raw: string): string | undefined {
	const clean = stripSeparators(raw).toUpperCase();

	if (!/^[A-Z0-9]{18}\d{2}$/.test(clean)) {
		return undefined;
	}

	return iso7064Mod97Dash10IsValid(clean) ? clean : undefined;
}

function canonicalizeDoi(raw: string): string | undefined {
	const clean = raw
		.trim()
		.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
		.replace(/^doi:/i, '')
		.toLowerCase();

	return /^10\.\d{4,9}\/\S+$/.test(clean) ? clean : undefined;
}

function canonicalizeEidr(raw: string): string | undefined {
	const clean = raw
		.trim()
		.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
		.toUpperCase();

	return /^10\.5240\/[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-Z]$/.test(
		clean
	)
		? clean
		: undefined;
}

function canonicalizeWikidata(raw: string): string | undefined {
	const clean = raw
		.trim()
		.replace(/^https?:\/\/(www\.)?wikidata\.org\/(wiki|entity)\//i, '')
		.toUpperCase();

	return /^Q[1-9]\d*$/.test(clean) ? clean : undefined;
}

function canonicalizeMbid(raw: string): string | undefined {
	const match = raw
		.trim()
		.toLowerCase()
		.match(/^(?:https?:\/\/musicbrainz\.org\/)?([a-z-]+)[/:]([0-9a-f-]{36})$/);

	if (!match) {
		return undefined;
	}

	const entityType = match[1] ?? '';
	const uuid = match[2] ?? '';

	if (!(MBID_ENTITY_TYPES.has(entityType) && UUID_PATTERN.test(uuid))) {
		return undefined;
	}

	return `${entityType}:${uuid}`;
}

/** OpenLibrary IDs: OL…W (work) / OL…M (edition) / OL…A (author). Open data (T2). */
function canonicalizeOpenLibrary(raw: string): string | undefined {
	const clean = raw
		.trim()
		.replace(/^https?:\/\/(www\.)?openlibrary\.org\/(works|books|authors)\//i, '')
		.replace(/\/.*$/, '')
		.toUpperCase();

	return /^OL\d+[AMW]$/.test(clean) ? clean : undefined;
}

function canonicalizeImdb(raw: string): string | undefined {
	const clean = raw
		.trim()
		.replace(/^https?:\/\/(www\.)?imdb\.com\/(title|name)\//i, '')
		.replace(/\/.*$/, '')
		.toLowerCase();

	return /^(tt|nm|co|ev|ch|ni)\d{6,}$/.test(clean) ? clean : undefined;
}

function canonicalizeTmdb(raw: string): string | undefined {
	const match = raw
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\/(www\.)?themoviedb\.org\//, '')
		.replace(/^([a-z]+\/\d+)-[^/]*$/, '$1')
		.match(/^([a-z]+)[/:](\d+)$/);

	if (!match) {
		return undefined;
	}

	const entityType = match[1] ?? '';
	const id = match[2] ?? '';
	return TMDB_ENTITY_TYPES.has(entityType) ? `${entityType}:${id}` : undefined;
}

function canonicalizePodcastGuid(raw: string): string | undefined {
	const clean = raw.trim().toLowerCase();
	return UUID_PATTERN.test(clean) ? clean : undefined;
}

/**
 * `url` scheme v0.2 (spec schemes/url.md): scheme folded to https, leading `www.` stripped,
 * default port dropped, fragment dropped, tracking params dropped, remaining
 * query params sorted by key, trailing slashes stripped on all paths.
 * Redirect and `rel=canonical` resolution is enrichment, done BEFORE this.
 */
function canonicalizeUrl(raw: string): string | undefined {
	let parsed: URL;

	try {
		parsed = new URL(raw.trim());
	} catch {
		return undefined;
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return undefined;
	}

	const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
	const params: [string, string][] = [];

	parsed.searchParams.forEach((value, key) => {
		if (!TRACKING_PARAM_PATTERN.test(key)) {
			params.push([key, value]);
		}
	});

	params.sort((a, b) => {
		if (a[0] === b[0]) {
			return a[1] < b[1] ? -1 : 1;
		}

		return a[0] < b[0] ? -1 : 1;
	});

	const query = params
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join('&');
	const path = parsed.pathname.replace(/\/+$/, '');
	const port =
		parsed.port && parsed.port !== '443' && parsed.port !== '80' ? `:${parsed.port}` : '';
	return `https://${host}${port}${path}${query ? `?${query}` : ''}`;
}

function canonicalizeCaip10(raw: string): string | undefined {
	const match = raw.trim().match(/^([-a-z0-9]{3,8}):([-_a-zA-Z0-9]{1,32}):(.+)$/);

	if (!match) {
		return undefined;
	}

	const namespace = match[1] ?? '';
	const reference = match[2] ?? '';
	const address = match[3] ?? '';

	if (namespace === 'eip155') {
		return /^0x[0-9a-fA-F]{40}$/.test(address)
			? `eip155:${reference}:${address.toLowerCase()}`
			: undefined;
	}

	return `${namespace}:${reference}:${address}`;
}

function canonicalizeCaip19(raw: string): string | undefined {
	const match = raw.trim().match(/^([-a-z0-9]{3,8}):([-_a-zA-Z0-9]{1,32})\/([-a-z0-9]{3,8}):(.+)$/);

	if (!match) {
		return undefined;
	}

	const namespace = match[1] ?? '';
	const reference = match[2] ?? '';
	const assetNamespace = match[3] ?? '';
	const assetReference = match[4] ?? '';

	if (namespace === 'eip155' && /^0x[0-9a-fA-F]{40}$/.test(assetReference)) {
		return `eip155:${reference}/${assetNamespace}:${assetReference.toLowerCase()}`;
	}

	return `${namespace}:${reference}/${assetNamespace}:${assetReference}`;
}

function canonicalizeContentHash(raw: string): string | undefined {
	const match = raw
		.trim()
		.toLowerCase()
		.match(/^([a-z0-9]+):(?:0x)?([0-9a-f]{64})$/);

	if (!match) {
		return undefined;
	}

	const algorithm = match[1] ?? '';
	const digest = match[2] ?? '';
	return HASH_ALGORITHMS.has(algorithm) ? `${algorithm}:${digest}` : undefined;
}

function canonicalizeAppId(raw: string): string | undefined {
	const match = raw.trim().match(/^([a-z]+):(.+)$/i);

	if (!match) {
		return undefined;
	}

	const store = (match[1] ?? '').toLowerCase();
	const bundleId = (match[2] ?? '').toLowerCase();

	if (!(APP_STORES.has(store) && /^[a-z0-9._-]+$/.test(bundleId))) {
		return undefined;
	}

	return `${store}:${bundleId}`;
}

/**
 * Package URL with the redundant `pkg:` prefix dropped and any version
 * qualifier stripped — the IID identifies the package, not a release.
 */
function canonicalizePurl(raw: string): string | undefined {
	const clean = raw
		.trim()
		.replace(/^pkg:/i, '')
		.replace(/[@?#].*$/, '');

	return /^[a-z0-9.+-]+\/[^\s]+$/i.test(clean) ? clean.toLowerCase() : undefined;
}

function canonicalizeGeo(raw: string): string | undefined {
	const clean = raw.trim().toLowerCase();
	return /^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$/.test(clean) ? clean : undefined;
}

/**
 * Platform account: `<platform>:<immutable-user-id>` (strong form) or
 * `<platform>:@<handle>` (weak form — handles rename and get recycled).
 */
function canonicalizeAcct(raw: string): string | undefined {
	const match = raw.trim().match(/^([a-z0-9-]+):(@?)(.+)$/i);

	if (!match) {
		return undefined;
	}

	const platform = (match[1] ?? '').toLowerCase();
	const isHandle = match[2] === '@';
	const identifier = isHandle ? norm1(match[3] ?? '') : (match[3] ?? '');

	if (identifier.length === 0 || /\s/.test(identifier)) {
		return undefined;
	}

	return `${platform}:${isHandle ? '@' : ''}${identifier}`;
}

function canonicalizeRssItem(raw: string): string | undefined {
	const match = raw
		.trim()
		.toLowerCase()
		.match(/^([0-9a-f-]{36}):([0-9a-f]{32})$/);

	if (!match) {
		return undefined;
	}

	const feedGuid = match[1] ?? '';
	return UUID_PATTERN.test(feedGuid) ? `${feedGuid}:${match[2] ?? ''}` : undefined;
}

function canonicalizeTermset(raw: string): string | undefined {
	const match = raw
		.trim()
		.toLowerCase()
		.match(/^([0-9a-f]{32}):([a-z0-9][a-z0-9-]*)$/);
	return match ? `${match[1]}:${match[2]}` : undefined;
}

/** gen1 values are BUILT (see gen1.ts), never canonicalized from raw input. */
function canonicalizeGen1(raw: string): string | undefined {
	const clean = raw.trim();
	return /^[a-z0-9-]+:r[1-9]\d*:[0-9a-f]{32}$/.test(clean) ? clean : undefined;
}

function define(
	scheme: SchemeName,
	identityClass: IdentityClass,
	canonicalize: (raw: string) => string | undefined
): SchemeDefinition {
	return {
		scheme,
		class: identityClass,
		canonicalize,
		isCanonical: (value: string) => canonicalize(value) === value,
	};
}

export const SCHEMES: Readonly<Record<SchemeName, SchemeDefinition>> = {
	isbn: define('isbn', 'A', canonicalizeIsbn),
	isrc: define('isrc', 'A', canonicalizeIsrc),
	iswc: define('iswc', 'A', canonicalizeIswc),
	isni: define('isni', 'A', canonicalizeIsni),
	orcid: define('orcid', 'A', canonicalizeIsni),
	lei: define('lei', 'A', canonicalizeLei),
	gtin: define('gtin', 'A', canonicalizeGtin),
	doi: define('doi', 'A', canonicalizeDoi),
	eidr: define('eidr', 'A', canonicalizeEidr),
	wd: define('wd', 'A', canonicalizeWikidata),
	mbid: define('mbid', 'A', canonicalizeMbid),
	olid: define('olid', 'A', canonicalizeOpenLibrary),
	imdb: define('imdb', 'A', canonicalizeImdb),
	tmdb: define('tmdb', 'A', canonicalizeTmdb),
	podcastguid: define('podcastguid', 'A', canonicalizePodcastGuid),
	url: define('url', 'B', canonicalizeUrl),
	caip10: define('caip10', 'B', canonicalizeCaip10),
	caip19: define('caip19', 'B', canonicalizeCaip19),
	hash: define('hash', 'B', canonicalizeContentHash),
	appid: define('appid', 'B', canonicalizeAppId),
	purl: define('purl', 'B', canonicalizePurl),
	geo: define('geo', 'B', canonicalizeGeo),
	acct: define('acct', 'B', canonicalizeAcct),
	rssitem: define('rssitem', 'B', canonicalizeRssItem),
	termset: define('termset', 'B', canonicalizeTermset),
	gen1: define('gen1', 'C', canonicalizeGen1),
};

/**
 * Scheme typing (spec §7.3): a P0 anchor (atom data = the bare IID) is only legal
 * when the scheme implies the entity's classification. `mbid` and `gen1`
 * carry their type inside the value; polymorphic schemes (`wd` covers
 * everything, `caip10` is account-or-contract, ...) floor at P1 where
 * `@type` lives in the payload.
 */
export const SCHEME_TYPING: Readonly<Record<SchemeName, 'unambiguous' | 'polymorphic'>> = {
	isbn: 'unambiguous',
	isrc: 'unambiguous',
	iswc: 'unambiguous',
	isni: 'polymorphic', // persons AND bands/orgs
	orcid: 'polymorphic', // a researcher is a person, but so is isni — keep symmetric
	lei: 'unambiguous',
	gtin: 'unambiguous',
	doi: 'polymorphic', // articles, datasets, film (EIDR)
	eidr: 'unambiguous',
	wd: 'polymorphic',
	mbid: 'unambiguous', // type segment in-value
	olid: 'unambiguous', // W/M/A suffix in-value
	imdb: 'polymorphic',
	tmdb: 'polymorphic', // ratified polymorphic (person segment spans classifications)
	podcastguid: 'unambiguous',
	url: 'polymorphic',
	caip10: 'polymorphic', // account OR contract
	caip19: 'unambiguous',
	hash: 'polymorphic',
	appid: 'unambiguous',
	purl: 'unambiguous',
	geo: 'polymorphic', // a cell is a place, but location vs local-business
	acct: 'unambiguous',
	rssitem: 'unambiguous',
	termset: 'unambiguous',
	gen1: 'unambiguous', // classification slug in-value (still never P0 — Class C)
};

export function getScheme(name: string): SchemeDefinition | undefined {
	return Object.hasOwn(SCHEMES, name) ? SCHEMES[name as SchemeName] : undefined;
}
