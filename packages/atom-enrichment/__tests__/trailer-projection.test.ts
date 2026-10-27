import { describe, expect, test } from 'bun:test';
import { selectPrimaryTrailer } from '../src/trailer-projection';

const KEY = 'abcdefghijk';
const video = (fields: Record<string, unknown> = {}) => ({
	key: KEY,
	site: 'YouTube',
	type: 'Trailer',
	...fields,
});
const artifact = (artifactKind: string, results: unknown) => ({
	artifactKind,
	data:
		artifactKind === 'tmdb'
			? { tmdbApiPayload: { videos: { results } } }
			: artifactKind === 'tmdb_sidecar'
				? { videos: { results } }
				: { results },
});
const select = (results: unknown) =>
	selectPrimaryTrailer([artifact('tmdb-videos', results)], 'Movie');
const trailer = (key = KEY) => ({
	'@type': 'VideoObject' as const,
	url: `https://www.youtube.com/watch?v=${key}`,
	embedUrl: `https://www.youtube.com/embed/${key}`,
	thumbnailUrl: `https://i.ytimg.com/vi/${key}/hqdefault.jpg`,
});

describe('primary TMDB trailer projection', () => {
	test.each([
		'tmdb',
		'tmdb_sidecar',
		'tmdb-videos',
	])('reads %s, including wrapped artifact data', (kind) => {
		const source = artifact(kind, [video()]);
		expect(selectPrimaryTrailer([source], 'Movie')).toEqual(trailer());
		expect(selectPrimaryTrailer([{ ...source, data: { data: source.data } }], 'TVSeries')).toEqual(
			trailer()
		);
	});
	test('unions and deduplicates kinds independently of artifact order', () => {
		const sources = [
			artifact('tmdb', [video({ type: 'Teaser', official: true })]),
			artifact('tmdb_sidecar', [video({ official: false })]),
			artifact('tmdb-videos', [video({ official: true, name: 'Winner' })]),
		];
		expect(selectPrimaryTrailer(sources, 'Movie')).toEqual({ ...trailer(), name: 'Winner' });
		expect(selectPrimaryTrailer([...sources].reverse(), 'Movie')).toEqual(
			selectPrimaryTrailer(sources, 'Movie')
		);
	});
	test.each([
		{
			name: 'Trailer precedes official Teaser',
			loser: { type: 'Teaser', official: true },
			winner: { official: false },
		},
		{
			name: 'official precedes unofficial',
			loser: { official: false },
			winner: { official: true },
		},
		{
			name: 'earliest publication wins',
			loser: { published_at: '2026-01-02T00:00:00Z' },
			winner: { published_at: '2026-01-01T00:00:00Z' },
		},
		{
			name: 'missing publication sorts last',
			loser: {},
			winner: { published_at: '2026-01-01T00:00:00Z' },
		},
		{
			name: 'fractional timestamps compare chronologically',
			loser: { published_at: '2026-01-01T00:00:00.1Z' },
			winner: { published_at: '2026-01-01T00:00:00Z' },
		},
	])('$name', ({ loser, winner }) => {
		const expected = 'zzzzzzzzzzz';
		const entries = [video({ ...loser, key: 'AAAAAAAAAAA' }), video({ ...winner, key: expected })];
		expect(select(entries)?.url).toBe(trailer(expected).url);
		expect(select([...entries].reverse())?.url).toBe(trailer(expected).url);
	});
	test('uses key ascending as final rank tie-break', () => {
		expect(select([video({ key: 'zzzzzzzzzzz' }), video({ key: 'AAAAAAAAAAA' })])?.url).toBe(
			trailer('AAAAAAAAAAA').url
		);
	});
	test.each([
		{ site: 'Vimeo' },
		{ site: 'youtube' },
		{ type: 'Clip' },
		{ type: 'Featurette' },
		{ key: 'short' },
		{ key: 'abcdefghijkl' },
		{ key: 'abcdefghi!k' },
		{ key: '../abcdefgh' },
		{ key: 'abcdefghij\n' },
	])('skips inadmissible video %j', (fields) => {
		expect(select([video(fields)])).toBeUndefined();
	});
	test.each([null, {}, 'videos', 1])('tolerates malformed results %j', (results) => {
		expect(select(results)).toBeUndefined();
	});
	test('tolerates malformed entries and unknown artifact kinds', () => {
		expect(select([null, [], 1, {}, video()])).toEqual(trailer());
		expect(selectPrimaryTrailer([artifact('other', [video()])], 'Movie')).toBeUndefined();
	});
	test.each(['Book', 'MusicAlbum', 'Thing', 'movie'])('does not project for %s', (schemaType) => {
		expect(selectPrimaryTrailer([artifact('tmdb', [video()])], schemaType)).toBeUndefined();
	});
	test('projects trimmed name, language and upload date', () => {
		expect(
			select([
				video({
					name: '  Official trailer  ',
					iso_639_1: 'en',
					iso_3166_1: 'US',
					published_at: '2026-01-01T00:00:00.123Z',
				}),
			])
		).toEqual({
			...trailer(),
			name: 'Official trailer',
			inLanguage: 'en-US',
			uploadDate: '2026-01-01T00:00:00.123Z',
		});
	});
	test('accepts a Teaser when there is no Trailer', () => {
		expect(select([video({ type: 'Teaser' })])).toEqual(trailer());
	});
	test.each([
		{ fields: {}, expected: {} },
		{
			fields: { name: '  ', iso_639_1: 'EN', iso_3166_1: 'US', published_at: 'not-a-date' },
			expected: {},
		},
		{ fields: { iso_639_1: 'en', iso_3166_1: 'us' }, expected: { inLanguage: 'en' } },
		{ fields: { iso_639_1: 'en' }, expected: { inLanguage: 'en' } },
		{ fields: { iso_3166_1: 'US' }, expected: {} },
	])('omits unavailable optional fields %j', ({ fields, expected }) => {
		expect(select([video(fields)])).toEqual({ ...trailer(), ...expected });
	});
});

test('F1 omits uploadDate for a 70000-character publication fraction', () => {
	const result = select([video({ published_at: `2020-01-01T00:00:00.${'1'.repeat(70000)}Z` })]);
	expect(result).toEqual(trailer());
});
