import { expect, test } from 'bun:test';
import { createClassificationEngine } from '../../engine';
import { createV0TypeProfilesPlugin } from '../index';
import { createSpotifyPlugin } from './index';

const id = '4uLU6hMCjMI75M1A2tKUQC';
for (const [subtype, schemaType, category] of [
	['album', 'MusicAlbum', 'music-album'],
	['artist', 'MusicGroup', 'artist'],
	['track', 'MusicRecording', 'song'],
	['show', 'PodcastSeries', 'podcast'],
	['episode', 'PodcastEpisode', 'podcast'],
] as const) {
	test(`Spotify ${subtype} uses its identity category`, async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => {
				throw new Error('Fixture classification failed');
			},
			runtime: 'server',
			plugins: [createV0TypeProfilesPlugin(), createSpotifyPlugin()],
		});
		const result = await engine.classify({
			input: `https://open.spotify.com/${subtype}/${id}`,
			mode: 'server-only',
			classificationSessionId: subtype,
		});
		expect(result.resolved?.atoms[0]).toMatchObject({ schemaType, category });
	});
}

test('Spotify album metadata keeps the album category', async () => {
	const engine = createClassificationEngine({
		onClassifierError: () => {
			throw new Error('Fixture classification failed');
		},
		runtime: 'server',
		plugins: [
			createV0TypeProfilesPlugin(),
			createSpotifyPlugin({
				adapters: {
					openGraph: () => ({
						schemaType: 'WebSite',
						category: 'thing',
						title: 'Album',
						canonicalId: 'ignored',
						data: { name: 'Album' },
					}),
				},
			}),
		],
	});
	const result = await engine.classify({
		input: `https://open.spotify.com/album/${id}`,
		mode: 'server-only',
		classificationSessionId: 'album-metadata',
	});
	expect(result.resolved?.atoms[0]).toMatchObject({
		schemaType: 'MusicAlbum',
		category: 'music-album',
	});
});
