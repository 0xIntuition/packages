import { tryParseUrl } from '../shared/helpers';

export const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function canonicalYouTubeVideoId(input: string | URL): string | undefined {
	const parsed = typeof input === 'string' ? tryParseUrl(input) : input;
	return parsed ? parseYouTubeVideoId(parsed) : undefined;
}

export function parseYouTubeVideoId(parsed: URL): string | undefined {
	const host = parsed.hostname.toLowerCase();
	const hostWithoutWww = host.replace(/^www\./, '');
	const normalizedHost =
		hostWithoutWww === 'm.youtube.com' || hostWithoutWww === 'music.youtube.com'
			? 'youtube.com'
			: hostWithoutWww;

	if (normalizedHost === 'youtu.be') {
		const candidate = parsed.pathname.split('/').filter(Boolean)[0];
		if (candidate && YOUTUBE_VIDEO_ID_PATTERN.test(candidate)) {
			return candidate;
		}

		return undefined;
	}

	if (normalizedHost !== 'youtube.com' && normalizedHost !== 'youtube-nocookie.com') {
		return undefined;
	}

	const normalizedPath = parsed.pathname.replace(/\/+$/u, '') || '/';
	if (normalizedPath === '/watch') {
		const fromQuery = parsed.searchParams.get('v');
		return fromQuery && YOUTUBE_VIDEO_ID_PATTERN.test(fromQuery) ? fromQuery : undefined;
	}

	const segments = normalizedPath.split('/').filter(Boolean);
	const firstSegment = segments[0];
	const secondSegment = segments[1];
	if (!firstSegment || !secondSegment) {
		return undefined;
	}

	// Path-scoped video forms. `/live/<id>` is YouTube's alias for
	// `/watch?v=<id>` (the same 11-char video id and the same VideoObject), so
	// it mints the same identity as the watch URL; channel, playlist, user,
	// handle, results and feed paths are never videos (ENG-15148 ruling).
	const hasVideoSegment = ['shorts', 'embed', 'v', 'live'].includes(firstSegment);
	if (!hasVideoSegment) {
		return undefined;
	}

	if (YOUTUBE_VIDEO_ID_PATTERN.test(secondSegment)) {
		return secondSegment;
	}

	return undefined;
}
