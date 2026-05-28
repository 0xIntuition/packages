import type { Hex } from 'viem';
import { toHex } from 'viem';

import { calculateAtomId } from './atom-id';
import type { AtomId } from './types';

export const OAUTH_ATOM_TYPE = 'IntuitionOAuthAtom' as const;
export const OAUTH_ATOM_CONTEXT = 'https://schema.intuition.systems/v1/oauth-atom.jsonld' as const;
export const OAUTH_ATOM_DERIVATION_VERSION = 'oauth-atom-wallet-v1' as const;

export const OAUTH_PROVIDERS = ['google', 'github', 'apple', 'twitter'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type OAuthAtomData = {
	'@type': typeof OAUTH_ATOM_TYPE;
	'@context': typeof OAUTH_ATOM_CONTEXT;
	provider: OAuthProvider;
	providerId: string;
};

export type OAuthAtomInput = {
	provider: string;
	providerAccountId: string | number | bigint | boolean;
};

export function normalizeOAuthProvider(provider: string): OAuthProvider {
	const normalized = provider.trim().toLowerCase();
	if (OAUTH_PROVIDERS.includes(normalized as OAuthProvider)) {
		return normalized as OAuthProvider;
	}

	throw new Error(`Unsupported OAuth provider: ${provider}`);
}

export function createOAuthAtomData(input: OAuthAtomInput): OAuthAtomData {
	const provider = normalizeOAuthProvider(input.provider);
	const providerAccountId = String(input.providerAccountId);
	if (!providerAccountId) {
		throw new Error('OAuth provider account ID is required.');
	}

	return {
		'@type': OAUTH_ATOM_TYPE,
		'@context': OAUTH_ATOM_CONTEXT,
		provider,
		providerId: providerAccountId,
	};
}

export function serializeOAuthAtomData(input: OAuthAtomInput): string {
	const atom = createOAuthAtomData(input);
	return `{"@type":"${atom['@type']}","@context":"${atom['@context']}","provider":"${atom.provider}","providerId":"${escapeJsonString(atom.providerId)}"}`;
}

export function oauthAtomDataHex(input: OAuthAtomInput): Hex {
	return toHex(serializeOAuthAtomData(input));
}

export function calculateOAuthAtomId(input: OAuthAtomInput): AtomId {
	return calculateAtomId(serializeOAuthAtomData(input));
}

function escapeJsonString(value: string): string {
	return JSON.stringify(value).slice(1, -1);
}
