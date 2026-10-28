import { describe, expect, it } from 'bun:test';
import { identifierHintsForIid } from '@0xintuition/iid-registry';
import { canonicalizeIid, hasInvalidEmbeddedIid, resolveIdentifierHints } from '../src/identifier';

const id = '4Z8W4fKeB5YxbusRsdQVPb';
const rows = [
	['spotify:artist', id, 'spotifyArtistId', id],
	['spotify:album', id, 'spotifyAlbumId', id],
	['spotify:track', id, 'spotifyId', `track:${id}`],
	['spotify:playlist', id, 'spotifyPlaylistId', id],
	['spotify:show', id, 'spotifyShowId', id],
	['spotify:episode', id, 'spotifyEpisodeId', id],
	['steam:app', '570', 'steamAppId', '570'],
	['youtube:video', 'dQw4w9WgXcQ', 'youtubeVideoId', 'dQw4w9WgXcQ'],
	['coingecko', 'bitcoin', 'coingeckoId', 'bitcoin'],
	['places', 'example-place', 'placeId', 'example-place'],
] as const;

describe('provider-local handle hints', () => {
	for (const [prefix, value, key, hint] of rows) {
		it(`derives and recognizes ${prefix}`, () => {
			const input = { jsonLd: { identifier: `int:${prefix}:${value}` } };
			expect(resolveIdentifierHints(input)).toEqual({ [key]: hint });
			expect(hasInvalidEmbeddedIid(input)).toBe(false);
			expect(canonicalizeIid(input.jsonLd.identifier)).toBeUndefined();
			expect(
				resolveIdentifierHints({ ...input, hints: { identifiers: { [key]: 'caller' } } })
			).toEqual({ [key]: 'caller' });
		});
	}
	for (const identifier of [
		'int:nope:1',
		'int:spotify:artist:bad',
		`int:spotify:artist:${id}:extra`,
		'int:steam:app:0',
		// Over the ladder's IID value cap (220): the prefix table matches, the ladder rejects.
		`int:coingecko:${'a'.repeat(221)}`,
		`int:goodreads:book:${'1'.repeat(216)}`,
		`int:steam:app:${'1'.repeat(217)}`,
	]) {
		it(`rejects ${identifier}`, () => {
			expect(resolveIdentifierHints({ jsonLd: { identifier } })).toBeUndefined();
			expect(hasInvalidEmbeddedIid({ jsonLd: { identifier } })).toBe(true);
		});
	}
	it('accepts a value exactly at the ladder length cap', () => {
		const value = 'a'.repeat(220);
		const input = { jsonLd: { identifier: `int:coingecko:${value}` } };
		expect(resolveIdentifierHints(input)).toEqual({ coingeckoId: value });
		expect(hasInvalidEmbeddedIid(input)).toBe(false);
	});
	it('recognizes descriptive Goodreads without inventing a consumer', () => {
		const input = { jsonLd: { identifier: 'int:goodreads:book:123' } };
		expect(resolveIdentifierHints(input)).toBeUndefined();
		expect(hasInvalidEmbeddedIid(input)).toBe(false);
	});
	for (const identifier of [
		'int:tmdb:movie:550',
		'int:imdb:tt0137523',
		'int:wd:Q42',
		'int:isrc:USUM71703861',
	]) {
		it(`preserves registered hints for ${identifier}`, () => {
			const expected = identifierHintsForIid(identifier);
			expect(resolveIdentifierHints({ jsonLd: { identifier } })).toEqual(expected);
			expect(hasInvalidEmbeddedIid({ jsonLd: { identifier } })).toBe(false);
			expect(
				resolveIdentifierHints({
					jsonLd: { identifier },
					hints: {
						identifiers: {
							...Object.fromEntries(Object.keys(expected).map((key) => [key, 'caller'])),
							extra: 'kept',
						},
					},
				})
			).toEqual({ ...expected, extra: 'kept' });
		});
	}
});
