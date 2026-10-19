import { describe, expect, it } from 'vitest';
import {
	IDENTITY_CATEGORY_ALIAS_ONLY_POLICY,
	IDENTITY_CATEGORY_RUNG_POLICY,
	iidForIdentityRung,
	projectIdentifierLadder,
	schemeOrderForIdentityCategory,
	UNREGISTERED_PROVIDER_LOCAL_PREFIXES,
} from '../index.js';

describe('registered provider-local emission', () => {
	for (const id of [
		'podcast-index:3421639',
		'podcast-index:123',
		'letterboxd:film:moonlight',
		'apple-podcasts:1222114325',
	]) {
		it(`${id}: emits the reference handle fixture`, () => {
			expect(projectIdentifierLadder({ providerCanonicalId: id })).toEqual({
				iid: `int:${id}`,
				rung: 'handle',
			});
			expect(UNREGISTERED_PROVIDER_LOCAL_PREFIXES.some((prefix) => id.startsWith(prefix))).toBe(
				false
			);
		});
		it(`${id}: remains a handle when supplied as an IID`, () => {
			expect(projectIdentifierLadder({ providerCanonicalId: `int:${id}` })).toEqual({
				iid: `int:${id}`,
				rung: 'handle',
			});
		});
	}
	it.each([
		'podcast-series',
		'podcast-episode',
	] as const)('podcast-index: second in %s and emits a handle', (category) => {
		expect(IDENTITY_CATEGORY_RUNG_POLICY[category][1]).toBe('podcast-index');
		expect(iidForIdentityRung('podcast-index', '123')).toBe('int:podcast-index:123');
		expect(
			projectIdentifierLadder({
				providerCanonicalId: 'podcast-index:123',
				strongIdentifierOrder: schemeOrderForIdentityCategory(category),
			})
		).toEqual({ iid: 'int:podcast-index:123', rung: 'handle' });
	});
	it('apple-podcasts: available as a matching alias, excluded from primary strong selection', () => {
		expect(iidForIdentityRung('apple-podcasts', '1222114325')).toBe(
			'int:apple-podcasts:1222114325'
		);
		expect(IDENTITY_CATEGORY_ALIAS_ONLY_POLICY['podcast-series']).toEqual(['wd', 'apple-podcasts']);
		expect(schemeOrderForIdentityCategory('podcast-series')).not.toContain('apple-podcasts');
		expect(
			projectIdentifierLadder({
				strongIdentifiers: { 'apple-podcasts': '1222114325' },
				strongIdentifierOrder: schemeOrderForIdentityCategory('podcast-series'),
			})
		).toEqual({ iid: null, fallback: 'envelope', reason: 'no-identifier' });
	});
	it('letterboxd: adds no movie category rung', () => {
		expect(IDENTITY_CATEGORY_RUNG_POLICY.movie).toEqual(['wd:film', 'tmdb:movie', 'imdb:title']);
	});
	it.each([
		'podcast-index:0123',
		'podcast-index:0',
		'apple-podcasts:0123',
		'apple-podcasts:0',
		'letterboxd:film:Moonlight',
		'letterboxd:film:moon--light',
	])('rejects malformed provider value %s', (providerCanonicalId) => {
		expect(projectIdentifierLadder({ providerCanonicalId })).toEqual({
			iid: null,
			fallback: 'envelope',
			reason: 'invalid-handle',
		});
	});
	it.each([
		'podcast-index',
		'apple-podcasts',
		'letterboxd',
	])('%s: never enters registry-backed strong selection', (scheme) => {
		expect(
			projectIdentifierLadder({
				strongIdentifiers: { [scheme]: scheme === 'letterboxd' ? 'film:moonlight' : '123' },
			})
		).toEqual({ iid: null, fallback: 'envelope', reason: 'no-identifier' });
	});
});
