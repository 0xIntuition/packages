import { toHex } from 'viem';
import { describe, expect, it } from 'vitest';

import {
	calculateOAuthAtomId,
	createOAuthAtomData,
	oauthAtomDataHex,
	serializeOAuthAtomData,
} from '../oauth-atom';

const googleInput = {
	provider: 'google',
	providerAccountId: '123',
};

const canonicalGoogleJson =
	'{"@type":"IntuitionOAuthAtom","@context":"https://schema.intuition.systems/v1/oauth-atom.jsonld","provider":"google","providerId":"123"}';

describe('OAuth atom helpers', () => {
	it('creates the approved canonical atom data shape', () => {
		expect(createOAuthAtomData(googleInput)).toEqual({
			'@type': 'IntuitionOAuthAtom',
			'@context': 'https://schema.intuition.systems/v1/oauth-atom.jsonld',
			provider: 'google',
			providerId: '123',
		});
	});

	it('serializes with stable key order and no whitespace', () => {
		expect(serializeOAuthAtomData(googleInput)).toBe(canonicalGoogleJson);
		expect(oauthAtomDataHex(googleInput)).toBe(toHex(canonicalGoogleJson));
	});

	it('normalizes provider names without changing the provider account ID bytes', () => {
		expect(
			serializeOAuthAtomData({
				provider: ' GitHub ',
				providerAccountId: '  Mixed Case ID  ',
			})
		).toBe(
			'{"@type":"IntuitionOAuthAtom","@context":"https://schema.intuition.systems/v1/oauth-atom.jsonld","provider":"github","providerId":"  Mixed Case ID  "}'
		);
	});

	it('escapes provider account IDs through JSON string rules', () => {
		expect(
			serializeOAuthAtomData({
				provider: 'apple',
				providerAccountId: 'id"with\\chars',
			})
		).toBe(
			'{"@type":"IntuitionOAuthAtom","@context":"https://schema.intuition.systems/v1/oauth-atom.jsonld","provider":"apple","providerId":"id\\"with\\\\chars"}'
		);
	});

	it('locks the OAuth atom id vector', () => {
		expect(calculateOAuthAtomId(googleInput)).toBe(
			'0x240b91099e66393f222041889dfe9f42ccb54dd44e54f6b9bd0f9b48e5557ee1'
		);
	});

	it('rejects unsupported providers', () => {
		expect(() =>
			serializeOAuthAtomData({
				provider: 'email',
				providerAccountId: '123',
			})
		).toThrow('Unsupported OAuth provider');
	});

	it('rejects empty provider account IDs', () => {
		expect(() =>
			serializeOAuthAtomData({
				provider: 'google',
				providerAccountId: '',
			})
		).toThrow('OAuth provider account ID is required');
	});
});
