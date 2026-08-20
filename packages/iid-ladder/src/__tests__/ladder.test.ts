import { validateIntuitionId } from '@0xintuition/iid';
import { providersForIid } from '@0xintuition/iid-registry';
import { describe, expect, it } from 'vitest';
import {
	IID_VALUE_MAX_LENGTH,
	PROVIDER_PREFIX_MAPPINGS,
	projectIdentifierLadder,
	UNREGISTERED_PROVIDER_LOCAL_PREFIXES,
} from '../index.js';

describe('projectIdentifierLadder', () => {
	it('selects a canonical strong identifier before provider and URL inputs', () => {
		expect(
			projectIdentifierLadder({
				canonicalUrl: 'https://open.spotify.com/track/1kcfGBb6kSrGqNIMW7rAlB',
				providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
				strongIdentifiers: { isrc: 'USUM71703861' },
			})
		).toEqual({ iid: 'int:isrc:USUM71703861', rung: 'strong' });
	});

	it('uses classification order as both precedence and allowlist', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: ['isrc'],
				strongIdentifiers: { isbn: '9780140328721', isrc: 'USUM71703861' },
			})
		).toEqual({ iid: 'int:isrc:USUM71703861', rung: 'strong' });
	});

	it('refuses to repair a noncanonical strong identifier', () => {
		expect(projectIdentifierLadder({ strongIdentifiers: { isbn: '0-14-032872-6' } })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'no-identifier',
		});
	});

	it.each([
		['isbn:0-14-032872-6', 'int:isbn:9780140328721', ['openlibrary']],
		['github:user:OctoCat', 'int:acct:github:@octocat', ['github']],
		['openlibrary:work:OL45883W', 'int:olid:OL45883W', ['openlibrary']],
		[
			'eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			'int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			['etherscan'],
		],
	] as const)('maps registered provider handle %s', (providerCanonicalId, iid, providers) => {
		const result = projectIdentifierLadder({ providerCanonicalId });
		expect(result).toEqual({ iid, rung: 'handle' });
		expect(validateIntuitionId(iid)).toBe(true);
		expect(providersForIid(iid)).toEqual(providers);
	});

	it('never promotes a known provider-local namespace into an invalid IID', () => {
		expect(
			projectIdentifierLadder({
				providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'unregistered-provider' });
		expect(validateIntuitionId('int:spotify:track:1kcfGBb6kSrGqNIMW7rAlB')).toBe(false);
	});

	it('distinguishes malformed known handles from unregistered namespaces', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'spotify:track:not-a-real-id' })).toEqual(
			{ fallback: 'envelope', iid: null, reason: 'invalid-handle' }
		);
	});

	it('keeps the provider-local audit list derived from the frozen map', () => {
		expect(UNREGISTERED_PROVIDER_LOCAL_PREFIXES).toEqual(
			PROVIDER_PREFIX_MAPPINGS.filter((mapping) => mapping.kind === 'provider-local').map(
				(mapping) => mapping.providerPrefix
			)
		);
	});

	it('uses a canonical URL only when no provider canonical ID claims precedence', () => {
		expect(projectIdentifierLadder({ canonicalUrl: 'https://example.com/item' })).toEqual({
			iid: 'int:url:https://example.com/item',
			rung: 'url',
		});
	});

	it('enforces the IID value cap', () => {
		const prefix = 'https://example.com/';
		const atCap = `${prefix}${'a'.repeat(IID_VALUE_MAX_LENGTH - prefix.length)}`;
		const overCap = `${atCap}a`;
		expect(projectIdentifierLadder({ canonicalUrl: atCap })).toEqual({
			iid: `int:url:${atCap}`,
			rung: 'url',
		});
		expect(projectIdentifierLadder({ canonicalUrl: overCap })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'url-over-cap',
		});
	});
});
