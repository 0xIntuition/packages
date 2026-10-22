import { expect, test } from 'vitest';
import * as classifications from './index.js';

test('the shared Discover export preserves the former app media and activity mapping', () => {
	expect(Reflect.get(classifications, 'DISCOVER_ACTIVITY_GROUPS')).toEqual({
		read: ['Book'],
		watch: ['Movie', 'TVSeries', 'TVEpisode'],
		listen: ['MusicRecording', 'MusicAlbum', 'PodcastSeries', 'PodcastEpisode'],
	});
});
