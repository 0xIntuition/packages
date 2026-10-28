/** Runtime-constructor policy only; never sourced from requests or environment. */
export type EnrichmentNetworkOptions = {
	allowLoopbackFixtures?: boolean;
};

/**
 * Only a canonically spelled literal loopback host qualifies: `127.x.x.x` as
 * four decimal octets or `[::1]`, written that way in the URL itself. WHATWG
 * normalization would also accept `127.1`, `0x7f000001` or `2130706433`; those
 * shorthands are refused before parsing so the allowance reads as literally as
 * it is documented. DNS names never gain private admission.
 */
const CANONICAL_LOOPBACK_AUTHORITY = /^https?:\/\/(?:\[::1\]|127(?:\.\d{1,3}){3})(?=[:/?#]|$)/i;

export function isLoopbackFixtureUrl(value: string): boolean {
	if (!CANONICAL_LOOPBACK_AUTHORITY.test(value)) return false;
	try {
		const url = new URL(value);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
		const hostname = url.hostname.replace(/^\[|\]$/g, '');
		return hostname === '::1' || /^127(?:\.\d{1,3}){3}$/.test(hostname);
	} catch {
		return false;
	}
}
