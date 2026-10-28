import { describe, expect, it } from 'vitest';
import {
	createLadder,
	type IdentityRungToken,
	iidForIdentityRung,
	PROVIDER_PREFIX_MAPPINGS,
	projectIdentifierLadder,
} from '../src/index.js';
import vectors from './fixtures/provider-local-handles.json';

const mint = createLadder({ providerLocalHandles: 'mint' });
const reject = createLadder({ providerLocalHandles: 'reject' });

describe('provider-local app known answers (7fc0c82b4)', () => {
	it.each(vectors.handles)('matches handle $input.providerCanonicalId', (vector) => {
		expect(mint.projectIdentifierLadder(vector.input)).toEqual(vector.mint);
		expect(reject.projectIdentifierLadder(vector.input)).toEqual(vector.reject);
		expect(projectIdentifierLadder(vector.input)).toEqual(vector.reject);
		if (vector.mint.iid)
			expect(vector.reject).toEqual({
				fallback: 'envelope',
				iid: null,
				reason: 'unregistered-provider',
			});
	});
	it.each(vectors.projections)('preserves precedence for $input.providerCanonicalId', (vector) => {
		expect(projectIdentifierLadder(vector.input, { providerLocalHandles: 'mint' })).toEqual(
			vector.mint
		);
		expect(projectIdentifierLadder(vector.input, { providerLocalHandles: 'reject' })).toEqual(
			vector.reject
		);
	});
	it.each(vectors.rungs)('preserves rung conversion $args', (vector) => {
		const [rung, value, schema] = vector.args;
		expect(
			mint.iidForIdentityRung(rung as IdentityRungToken, value!, schema ?? undefined) ?? null
		).toBe(vector.mint);
		expect(
			reject.iidForIdentityRung(rung as IdentityRungToken, value!, schema ?? undefined) ?? null
		).toBe(vector.reject);
		expect(
			iidForIdentityRung(rung as IdentityRungToken, value!, schema ?? undefined, {
				providerLocalHandles: 'mint',
			}) ?? null
		).toBe(vector.mint);
	});
	it('covers every provider-local prefix with a minted and rejected known answer', () => {
		for (const mapping of PROVIDER_PREFIX_MAPPINGS) {
			if (mapping.kind !== 'provider-local') continue;
			expect(
				vectors.handles.some(
					(row) =>
						row.input.providerCanonicalId.startsWith(mapping.providerPrefix) &&
						row.mint.iid !== null
				)
			).toBe(true);
		}
	});
	it('captures policy at construction and defaults to reject', () => {
		const options: { providerLocalHandles: 'mint' | 'reject' } = { providerLocalHandles: 'mint' };
		const ladder = createLadder(options);
		options.providerLocalHandles = 'reject';
		const input = { providerCanonicalId: 'goodreads:book:123' };
		expect(ladder.projectIdentifierLadder(input)).toEqual({
			iid: 'int:goodreads:book:123',
			rung: 'handle',
		});
		expect(createLadder().projectIdentifierLadder(input)).toEqual(
			reject.projectIdentifierLadder(input)
		);
	});
	it('preserves aliases, registered results, unknown prefixes, and already-prefixed inputs', () => {
		for (const input of [
			{},
			{ canonicalUrl: 'https://example.com' },
			{ providerCanonicalId: 'term:unknown' },
			{ providerCanonicalId: 'int:spotify:track:4Oju8V0OpOaz886J75roH5' },
			{
				providerCanonicalId: 'apple-podcasts:123',
				strongIdentifierOrder: ['podcastguid', 'podcast-index', 'spotify'],
			},
		])
			expect(mint.projectIdentifierLadder(input)).toEqual(reject.projectIdentifierLadder(input));
		for (const [rung, value, schema] of [
			['gtin', '00012345600012', 'MusicAlbum'],
			['wd', 'Q42', 'PodcastSeries'],
			['apple-podcasts', '123', 'PodcastSeries'],
		] as const)
			expect(mint.iidForIdentityRung(rung, value, schema)).toBeUndefined();
	});
});
