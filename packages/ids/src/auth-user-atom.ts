import type { Hex } from 'viem';
import { keccak256, toHex } from 'viem';

import { calculateAtomId } from './atom-id.js';
import type { AtomId } from './types.js';

export const AUTH_USER_ATOM_TYPE = 'IntuitionAuthUser' as const;
export const AUTH_USER_ATOM_CONTEXT = 'https://schema.0xintuition.com/v1/metadata.jsonld' as const;
export const AUTH_USER_ATOM_DERIVATION_VERSION = 'auth-user-default-wallet-v1' as const;

export type AuthUserAtomData = {
	'@type': typeof AUTH_USER_ATOM_TYPE;
	'@context': typeof AUTH_USER_ATOM_CONTEXT;
	derivationVersion: typeof AUTH_USER_ATOM_DERIVATION_VERSION;
	userIdHash: Hex;
};

export type AuthUserAtomInput = {
	userId: string;
};

export function authUserIdHash(userId: string): Hex {
	const normalized = normalizeAuthUserId(userId);
	return keccak256(toHex(`auth-user:${normalized}`));
}

export function createAuthUserAtomData(input: AuthUserAtomInput): AuthUserAtomData {
	return {
		'@type': AUTH_USER_ATOM_TYPE,
		'@context': AUTH_USER_ATOM_CONTEXT,
		derivationVersion: AUTH_USER_ATOM_DERIVATION_VERSION,
		userIdHash: authUserIdHash(input.userId),
	};
}

export function serializeAuthUserAtomData(input: AuthUserAtomInput): string {
	const atom = createAuthUserAtomData(input);
	return `{"@type":"${atom['@type']}","@context":"${atom['@context']}","derivationVersion":"${atom.derivationVersion}","userIdHash":"${atom.userIdHash}"}`;
}

export function authUserAtomDataHex(input: AuthUserAtomInput): Hex {
	return toHex(serializeAuthUserAtomData(input));
}

export function calculateAuthUserAtomId(input: AuthUserAtomInput): AtomId {
	return calculateAtomId(serializeAuthUserAtomData(input));
}

function normalizeAuthUserId(userId: string): string {
	const normalized = userId.trim().toLowerCase();
	if (!normalized) {
		throw new Error('Auth user ID is required.');
	}

	return normalized;
}
