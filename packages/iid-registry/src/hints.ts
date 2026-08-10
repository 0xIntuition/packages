/**
 * The IID => `hints.identifiers` mapping: one function from an IID to the
 * identifier keys enrichment providers read.
 *
 * Rules:
 * - Always emit the scheme-named key (`{ <scheme>: canonicalValue }`) so the
 *   hint map is self-describing, plus the aliases provider capability gates
 *   actually read — key names are a frozen consumer contract.
 * - Hints derive from the CANONICAL parsed IID only; uncanonicalizable input
 *   yields an empty map. Never emit an empty value.
 * - `mbid` bends the scheme-named rule deliberately: readers expect the bare
 *   MBID UUID, so `mbid`/`musicbrainz` carry the UUID and the entity type
 *   travels as `mbidType`.
 */
import { parseCanonical } from './canonical.js';

function stripHandlePrefix(identifier: string): string {
	return identifier.startsWith('@') ? identifier.slice(1) : identifier;
}

function caipHints(scheme: 'caip10' | 'caip19', value: string): Record<string, string> {
	const hints: Record<string, string> = { [scheme]: value };
	const match =
		scheme === 'caip10'
			? value.match(/^eip155:([-_a-zA-Z0-9]{1,32}):(.+)$/)
			: value.match(/^eip155:([-_a-zA-Z0-9]{1,32})\/[-a-z0-9]{3,8}:(.+)$/);

	if (match?.[1] && match[2]) {
		hints.chainId = match[1];
		hints.address = match[2];
	}

	return hints;
}

function acctHints(value: string): Record<string, string> {
	const hints: Record<string, string> = { acct: value };
	const separator = value.indexOf(':');

	if (separator <= 0) {
		return hints;
	}

	const platform = value.slice(0, separator);
	const identifier = stripHandlePrefix(value.slice(separator + 1));

	if (identifier.length === 0) {
		return hints;
	}

	if (platform === 'github') {
		hints['github-user'] = identifier;
	} else if (platform === 'x' || platform === 'twitter') {
		hints['x-handle'] = identifier;
	}

	return hints;
}

function purlHints(value: string): Record<string, string> {
	const hints: Record<string, string> = { purl: value };
	const separator = value.indexOf('/');

	if (separator <= 0 || separator === value.length - 1) {
		return hints;
	}

	const type = value.slice(0, separator);
	const rest = value.slice(separator + 1);

	if (type === 'npm') {
		hints.npm = rest;
	} else if (type === 'github') {
		hints['github-repo'] = rest;
	}

	return hints;
}

function mbidHints(value: string): Record<string, string> {
	const separator = value.indexOf(':');

	if (separator <= 0) {
		return { mbid: value };
	}

	const uuid = value.slice(separator + 1);
	return { mbid: uuid, musicbrainz: uuid, mbidType: value.slice(0, separator) };
}

/**
 * Build the `hints.identifiers` map for an IID. Empty map for malformed or
 * uncanonicalizable input. Never throws.
 */
export function identifierHintsForIid(iid: string): Record<string, string> {
	const parsed = parseCanonical(iid);

	if (!parsed) {
		return {};
	}

	const { scheme, value } = parsed;

	switch (scheme) {
		case 'wd':
			return { wd: value, wikidata: value };
		case 'tmdb':
			return { tmdb: value, tmdbId: value };
		case 'mbid':
			return mbidHints(value);
		case 'caip10':
		case 'caip19':
			return caipHints(scheme, value);
		case 'podcastguid':
			return { podcastguid: value, podcastGuid: value };
		case 'rssitem': {
			const hints: Record<string, string> = { rssitem: value };
			const feedGuid = value.slice(0, value.indexOf(':'));

			if (feedGuid.length > 0) {
				hints.podcastGuid = feedGuid;
			}

			return hints;
		}
		case 'acct':
			return acctHints(value);
		case 'purl':
			return purlHints(value);
		case 'geo':
			return { geo: value, geohash: value };
		default:
			return { [scheme]: value };
	}
}
