import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import type { ClassificationResult } from '../../src/types';
import album from './classify-output/spotify-album.json';
import artist from './classify-output/spotify-artist.json';
import show from './classify-output/spotify-show.json';

export const MUSIC_ARTIST_MBID = 'artist:5ae54dee-4dba-49c0-802a-a3b3b3adfe9b';
export const MUSIC_ALBUM_MBID = 'release-group:e5b96d62-1414-337b-b0c3-28a6c5d5b65a';
export const MUSIC_ISNI = '0000000121367029';
export const PODCAST_FEED = 'https://feeds.npr.org/510318/podcast.xml';
export function musicResult(kind: 'album' | 'artist' | 'show'): ClassificationResult {
	const vector = { album, artist, show }[kind];
	return {
		ok: true,
		status: 'complete',
		contractVersion: 'cpkg-02',
		runtime: 'server',
		mode: 'progressive',
		classificationSessionId: 'music-identity-fixture',
		policy: {},
		message: 'ok',
		receivedAt: '2026-10-02T00:00:00Z',
		resolved: {
			atoms: [structuredClone(vector.atom)],
			classifications: [],
			publishable: [],
			resolverId: 'fixture',
			resolverChain: ['fixture'],
			dedupeKey: 'fixture',
			fallbackUsed: false,
		},
		debug: {},
	} as unknown as ClassificationResult;
}
export function musicEntity(
	kind: 'album' | 'artist' | 'show',
	extra: Record<string, unknown> = {}
) {
	const property = { album: 'P2205', artist: 'P1902', show: 'P5916' }[kind];
	const atom = musicResult(kind).resolved?.atoms[0];
	const value = atom?.canonicalId?.split(':').at(-1);
	const claim = (entry: unknown) => [{ rank: 'normal', mainsnak: { datavalue: { value: entry } } }];
	return {
		entities: {
			Q189729: {
				id: 'Q189729',
				claims: {
					[property]: claim(value),
					...(kind === 'artist'
						? {
								P213: claim(MUSIC_ISNI),
								P434: claim(MUSIC_ARTIST_MBID.slice(7)),
								P31: claim({ id: 'Q5' }),
							}
						: {}),
					...(kind === 'album'
						? { P436: claim(MUSIC_ALBUM_MBID.slice(14)), P31: claim({ id: 'Q482994' }) }
						: {}),
					...(kind === 'show'
						? {
								P1019: claim(PODCAST_FEED),
								P5842: claim('1222114325'),
								P31: claim({ id: 'Q24634210' }),
							}
						: {}),
					...extra,
				},
			},
		},
	};
}
export function musicFetch(
	kind: 'album' | 'artist' | 'show',
	payload: unknown = musicEntity(kind)
) {
	// The identity bridge dials through the shared provider fetch, which only honours a pin-aware seam.
	return createPinAwareFetch(async (input: string | URL) =>
		new URL(String(input)).pathname.includes('Special:EntityData')
			? Response.json(payload)
			: Response.json({ query: { search: [{ title: 'Q189729' }] } })
	);
}
