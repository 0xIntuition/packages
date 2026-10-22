// Ported from the unmodified app at 7fc0c82b4.
import { describe, expect, test } from 'vitest';
import {
	createLadder,
	iidForIdentityRung as upstreamIidForIdentityRung,
	projectIdentifierLadder as upstreamProjectIdentifierLadder,
} from '../src/index.js';

const { iidForIdentityRung, projectIdentifierLadder } = createLadder({
	providerLocalHandles: 'mint',
});

const SPOTIFY_TRACK = 'spotify:track:4Oju8V0OpOaz886J75roH5';

describe('projectIdentifierLadder (application provider-local policy)', () => {
	test('mints a provider-local handle the public ladder leaves unregistered', () => {
		expect(upstreamProjectIdentifierLadder({ providerCanonicalId: SPOTIFY_TRACK })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'unregistered-provider',
		});
		expect(projectIdentifierLadder({ providerCanonicalId: SPOTIFY_TRACK })).toEqual({
			iid: `int:${SPOTIFY_TRACK}`,
			rung: 'handle',
		});
		expect(projectIdentifierLadder({ providerCanonicalId: 'goodreads:book:123' })).toEqual({
			iid: 'int:goodreads:book:123',
			rung: 'handle',
		});
	});

	test('returns every registered-scheme result from the public ladder untouched', () => {
		for (const input of [
			{ providerCanonicalId: 'imdb:title:tt1375666' },
			{ providerCanonicalId: 'apple-podcasts:1234' },
			{ providerCanonicalId: 'musicbrainz:artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56' },
			{ strongIdentifiers: { isrc: 'US-RC1-76-07839' }, strongIdentifierOrder: ['isrc'] },
			{ canonicalUrl: 'https://example.com/page' },
			{},
		]) {
			expect(projectIdentifierLadder(input)).toEqual(upstreamProjectIdentifierLadder(input));
		}
	});

	test('rejects handles that fail the provider grammar or carry whitespace', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'spotify:track:' })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'invalid-handle',
		});
		expect(projectIdentifierLadder({ providerCanonicalId: 'spotify:track:not valid' })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'invalid-handle',
		});
	});

	test('strong identifiers still outrank a provider-local handle', () => {
		expect(
			projectIdentifierLadder({
				providerCanonicalId: SPOTIFY_TRACK,
				strongIdentifiers: { isrc: 'US-RC1-76-07839' },
				strongIdentifierOrder: ['isrc'],
			})
		).toEqual({ iid: 'int:isrc:USRC17607839', rung: 'strong' });
	});
});

describe('iidForIdentityRung (application provider-local policy)', () => {
	test('converts provider-local rung tokens that upstream declines', () => {
		expect(upstreamIidForIdentityRung('spotify:track', '4Oju8V0OpOaz886J75roH5')).toBeUndefined();
		expect(iidForIdentityRung('spotify:track', '4Oju8V0OpOaz886J75roH5')).toBe(
			'int:spotify:track:4Oju8V0OpOaz886J75roH5'
		);
		expect(iidForIdentityRung('goodreads:book', '123')).toBe('int:goodreads:book:123');
	});

	test('keeps registered rung tokens on the public path', () => {
		expect(iidForIdentityRung('imdb:title', 'tt1375666')).toBe(
			upstreamIidForIdentityRung('imdb:title', 'tt1375666')
		);
		expect(iidForIdentityRung('isrc', 'US-RC1-76-07839')).toBe('int:isrc:USRC17607839');
	});

	test('rejects grammar failures', () => {
		expect(iidForIdentityRung('spotify:track', 'not valid')).toBeUndefined();
		expect(iidForIdentityRung('spotify:track', '')).toBeUndefined();
	});
});
