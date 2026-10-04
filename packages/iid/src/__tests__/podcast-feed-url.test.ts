import { expect, it } from 'vitest';
import { derivePodcastGuid, normalizePodcastFeedUrl } from '../uuid5.js';

it('FR3 feed normalization preserves userinfo, port, path and query bytes', () => {
	const first = normalizePodcastFeedUrl('https://User:PASS@Host.Example/feed');
	const second = normalizePodcastFeedUrl('https://user:pass@host.example/feed');
	expect(first).toBe('User:PASS@host.example/feed');
	expect(derivePodcastGuid(first)).not.toBe(derivePodcastGuid(second));
	expect(normalizePodcastFeedUrl('HTTPS://User:PASS@HOST:8080/Feed?Token=AbC')).toBe(
		'User:PASS@host:8080/Feed?Token=AbC'
	);
	expect(normalizePodcastFeedUrl('https://BÜCHER.EXAMPLE/Feed')).toBe('bücher.example/Feed');
	expect(normalizePodcastFeedUrl('')).toBe('');
	expect(normalizePodcastFeedUrl('/Feed?Token=AbC')).toBe('/Feed?Token=AbC');
});
