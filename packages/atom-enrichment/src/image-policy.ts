export type OpenGraphPageSourceRule = {
	host: string;
	policy: 'allow' | 'deny';
	reason: string;
};

/**
 * Shared page-source policy for seed and app OpenGraph fetches.
 *
 * TMDB page/image sourcing is licensed (commercial license 2026-09-01;
 * JP go 2026-09-16). This policy does not authorize new API endpoints.
 * Letterboxd metadata remains admissible because Letterboxd publishes it on
 * Letterboxd's own page.
 */
export const OPEN_GRAPH_PAGE_SOURCE_RULES: readonly OpenGraphPageSourceRule[] = [
	{
		host: 'themoviedb.org',
		policy: 'allow',
		reason: 'TMDB commercial license 2026-09-01; JP sourcing go 2026-09-16.',
	},
	{ host: 'letterboxd.com', policy: 'allow', reason: 'Letterboxd publisher metadata.' },
	{ host: 'wikipedia.org', policy: 'allow', reason: 'Wikipedia page metadata.' },
	{ host: 'wikimedia.org', policy: 'allow', reason: 'Wikimedia page metadata.' },
	{ host: 'wikidata.org', policy: 'allow', reason: 'Wikidata entity metadata.' },
	{ host: 'spotify.com', policy: 'allow', reason: 'Spotify publisher metadata.' },
	{ host: 'openlibrary.org', policy: 'allow', reason: 'Open Library publisher metadata.' },
	{ host: 'goodreads.com', policy: 'allow', reason: 'Goodreads publisher metadata.' },
	{ host: 'imdb.com', policy: 'deny', reason: 'IMDb pages are never a metadata source.' },
] as const;

export const IMAGE_PROVENANCE_FIELDS = [
	'image_license',
	'image_checked_at',
	'image_any_license',
	'image_any_checked_at',
] as const;

export type OpenGraphPageAuthorization = {
	authorizedUrl: string;
	kind: 'allowlisted' | 'generic-user-pasted';
};

export type PublicResolvedAddress = {
	address: string;
	family: 4 | 6;
};

export type ResolvePublicHostname = (hostname: string) => Promise<readonly PublicResolvedAddress[]>;

export function authorizeOpenGraphPageSource(
	value: string,
	options: { genericUserPasted?: boolean } = {}
): OpenGraphPageAuthorization | undefined {
	const url = parsePublicHttpUrl(value);
	if (!url) return undefined;

	const pageHost = url.hostname.toLowerCase().replace(/\.+$/, '');
	if (pageHost === 'imdb.com' || pageHost.endsWith('.imdb.com')) return undefined;
	for (const rule of OPEN_GRAPH_PAGE_SOURCE_RULES) {
		if (hostnameMatches(url.hostname, rule.host)) {
			return rule.policy === 'allow' ? { authorizedUrl: url.href, kind: 'allowlisted' } : undefined;
		}
	}

	return options.genericUserPasted === true
		? { authorizedUrl: url.href, kind: 'generic-user-pasted' }
		: undefined;
}

export function isAllowedOpenGraphPageSource(
	value: string,
	options: { genericUserPasted?: boolean } = {}
): boolean {
	return authorizeOpenGraphPageSource(value, options) !== undefined;
}

export function isAdmissibleMaterializedImage(input: {
	imageUrl: unknown;
	pageAuthorization?: OpenGraphPageAuthorization;
	pageSourceUrl?: unknown;
}): input is { imageUrl: string; pageSourceUrl?: string } {
	const imageUrl = readHttpsUrl(input.imageUrl);
	if (!imageUrl) {
		return false;
	}

	const pageSourceUrl = readHttpUrl(input.pageSourceUrl);
	if (!pageSourceUrl) return true;
	if (input.pageAuthorization?.authorizedUrl === pageSourceUrl) return true;
	return authorizeOpenGraphPageSource(pageSourceUrl)?.kind === 'allowlisted';
}

/** DNS-aware image admission used at the async fetch/persist boundary. */
export async function isAdmissibleMaterializedImageWithDns(
	input: {
		imageUrl: unknown;
		pageAuthorization?: OpenGraphPageAuthorization;
		pageSourceUrl?: unknown;
	},
	resolveHostname?: ResolvePublicHostname
): Promise<boolean> {
	return (
		isAdmissibleMaterializedImage(input) &&
		(await isPublicHttpsUrlWithDns(input.imageUrl, resolveHostname))
	);
}

/** The shared permissive policy: a collected `image_any` becomes `image`. */
export function selectPermissiveImage(input: {
	image?: unknown;
	imageAny?: unknown;
}): string | undefined {
	return readHttpsUrl(input.image) ?? readHttpsUrl(input.imageAny);
}

export function isPublicHttpsUrl(value: string): boolean {
	const url = parsePublicHttpUrl(value);
	return Boolean(url && url.protocol === 'https:' && isPublicHostname(url.hostname));
}

/**
 * Why a URL is or is not a public http(s) target:
 * - `public`: every address it resolves to is public;
 * - `private`: our policy refuses it (internal name, private literal or answer, bad shape);
 * - `not_found`: the host does not exist (NXDOMAIN, or no address records at all);
 * - `lookup_failed`: the lookup itself failed for another reason (SERVFAIL, timeout).
 */
export type PublicTargetVerdict = 'public' | 'private' | 'not_found' | 'lookup_failed';

const DNS_NOT_FOUND_CODES: ReadonlySet<string> = new Set(['ENOTFOUND', 'ENODATA']);

/**
 * Whether a resolver error (or its `cause` chain) says the name does not exist (NXDOMAIN, or no
 * address record) rather than that the lookup itself failed (SERVFAIL, timeout). The one
 * detector behind both the pre-check verdict and the pinned dial, so they cannot disagree.
 */
export function isDnsNotFoundError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const { code, message, cause } = error as { code?: unknown; message?: unknown; cause?: unknown };
	if (typeof code === 'string' && DNS_NOT_FOUND_CODES.has(code.toUpperCase())) return true;
	if (typeof message === 'string' && message.toLowerCase().includes('nxdomain')) return true;
	return isDnsNotFoundError(cause);
}

export async function classifyPublicHttpTarget(
	value: unknown,
	resolveHostname: ResolvePublicHostname = resolveHostnameWithNodeDns
): Promise<PublicTargetVerdict> {
	if (typeof value !== 'string') return 'private';
	const url = parsePublicHttpUrl(value);
	if (!url || !isPublicHostname(url.hostname)) return 'private';
	const hostname = normalizeHostname(url.hostname);
	if (ipAddressFamily(hostname)) return isPublicIpAddress(hostname) ? 'public' : 'private';

	let addresses: readonly PublicResolvedAddress[];
	try {
		addresses = await resolveHostname(hostname);
	} catch (error) {
		return isDnsNotFoundError(error) ? 'not_found' : 'lookup_failed';
	}
	if (addresses.length === 0) return 'not_found';
	return addresses.every(
		(entry) =>
			ipAddressFamily(normalizeHostname(entry.address)) === entry.family &&
			isPublicIpAddress(entry.address)
	)
		? 'public'
		: 'private';
}

export async function isPublicHttpUrlWithDns(
	value: unknown,
	resolveHostname: ResolvePublicHostname = resolveHostnameWithNodeDns
): Promise<boolean> {
	return (await classifyPublicHttpTarget(value, resolveHostname)) === 'public';
}

export async function isPublicHttpsUrlWithDns(
	value: unknown,
	resolveHostname?: ResolvePublicHostname
): Promise<boolean> {
	if (typeof value !== 'string') return false;
	const url = parsePublicHttpUrl(value);
	return Boolean(
		url && url.protocol === 'https:' && (await isPublicHttpUrlWithDns(url.href, resolveHostname))
	);
}

function readHttpsUrl(value: unknown): string | undefined {
	const url = readHttpUrl(value);
	return url && isPublicHttpsUrl(url) ? url : undefined;
}

export function readHttpUrl(value: unknown): string | undefined {
	if (typeof value !== 'string' || value.trim().length === 0) {
		return undefined;
	}
	const url = parsePublicHttpUrl(value.trim());
	return url?.href;
}

function parsePublicHttpUrl(value: string): URL | undefined {
	try {
		const url = new URL(value);
		if (
			(url.protocol !== 'http:' && url.protocol !== 'https:') ||
			url.username ||
			url.password ||
			// Non-default ports are never a public image/page source (R3 finding 1).
			url.port
		) {
			return undefined;
		}
		return url;
	} catch {
		return undefined;
	}
}

function isPublicHostname(hostname: string): boolean {
	const normalized = normalizeHostname(hostname);
	if (
		normalized === 'localhost' ||
		/\.(?:home|internal|intranet|lan|local|localdomain|localhost)$/u.test(normalized) ||
		(!normalized.includes('.') && !normalized.includes(':'))
	) {
		return false;
	}
	return ipAddressFamily(normalized) ? isPublicIpAddress(normalized) : !normalized.includes(':');
}

async function resolveHostnameWithNodeDns(
	hostname: string
): Promise<readonly PublicResolvedAddress[]> {
	const { lookup } = await import('node:dns/promises');
	const addresses = await lookup(hostname, { all: true, verbatim: true });
	return addresses.flatMap((entry) =>
		entry.family === 4 || entry.family === 6
			? [{ address: entry.address, family: entry.family }]
			: []
	);
}

function normalizeHostname(hostname: string): string {
	return hostname
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.+$/u, '');
}

function ipAddressFamily(address: string): 4 | 6 | undefined {
	const normalized = normalizeHostname(address);
	const segments = normalized.split('.');
	if (
		segments.length === 4 &&
		segments.every((segment) => /^\d{1,3}$/u.test(segment) && Number(segment) <= 255)
	) {
		return 4;
	}
	return expandIpv6Address(normalized) ? 6 : undefined;
}

function isPublicIpAddress(address: string): boolean {
	const normalized = normalizeHostname(address);
	if (ipAddressFamily(normalized) === 4) {
		const [first = 0, second = 0, third = 0] = normalized.split('.').map(Number);
		return !(
			first === 0 ||
			first === 10 ||
			first === 127 ||
			(first === 100 && second >= 64 && second <= 127) ||
			(first === 169 && second === 254) ||
			(first === 172 && second >= 16 && second <= 31) ||
			(first === 192 && second === 0 && third === 0) ||
			(first === 192 && second === 0 && third === 2) ||
			(first === 192 && second === 88 && third === 99) ||
			(first === 192 && second === 168) ||
			(first === 198 && (second === 18 || second === 19)) ||
			(first === 198 && second === 51 && third === 100) ||
			(first === 203 && second === 0 && third === 113) ||
			first >= 224
		);
	}
	const ipv6 = expandIpv6Address(normalized);
	if (!ipv6) return false;
	const [first = 0, second = 0] = ipv6;
	return !(
		first < 0x2000 ||
		first > 0x3fff ||
		(first === 0x2001 && second <= 0x01ff) ||
		(first === 0x2001 && second === 0x0db8) ||
		first === 0x2002 ||
		(first === 0x3fff && (second & 0xf000) === 0)
	);
}

function expandIpv6Address(hostname: string): number[] | undefined {
	const compressionIndex = hostname.indexOf('::');
	if (compressionIndex !== -1 && compressionIndex !== hostname.lastIndexOf('::')) return undefined;
	const [left = '', right = ''] = hostname.split('::');
	const leftSegments = left ? left.split(':') : [];
	const rightSegments = right ? right.split(':') : [];
	const missing = 8 - leftSegments.length - rightSegments.length;
	if ((compressionIndex === -1 && missing !== 0) || missing < 0) return undefined;
	const segments = [
		...leftSegments,
		...Array.from({ length: missing }, () => '0'),
		...rightSegments,
	];
	if (segments.length !== 8 || segments.some((segment) => !/^[\da-f]{1,4}$/iu.test(segment))) {
		return undefined;
	}
	return segments.map((segment) => Number.parseInt(segment, 16));
}

function hostnameMatches(hostname: string, suffix: string): boolean {
	const normalized = hostname.toLowerCase();
	return normalized === suffix || normalized.endsWith(`.${suffix}`);
}
