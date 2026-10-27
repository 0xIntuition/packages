import { describe, expect, test } from 'bun:test';
import { canonicalYouTubeVideoId } from './video-id';

const VIDEO_ID = 'u4ZoJKF_VuA';
const CONFLICTING_VIDEO_ID = 'dQw4w9WgXcQ';

describe('canonicalYouTubeVideoId', () => {
	test.each([
		`https://youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw?v=${VIDEO_ID}`,
		`https://youtube.com/c/abcdefghijk?v=${VIDEO_ID}`,
		`https://youtube.com/user/GoogleDevelopers?v=${VIDEO_ID}`,
		`https://youtube.com/@OpenAI?v=${VIDEO_ID}`,
		`https://youtube.com/playlist?list=PL1234567890&v=${VIDEO_ID}`,
		`https://youtube.com/results?search_query=intuition&v=${VIDEO_ID}`,
		`https://youtube.com/feed/subscriptions?v=${VIDEO_ID}`,
		`https://youtube.com/?v=${VIDEO_ID}`,
	])('rejects v= evidence outside the exact /watch path: %s', (url) => {
		expect(canonicalYouTubeVideoId(url)).toBeUndefined();
	});

	test.each([
		[`https://youtube.com/shorts/${VIDEO_ID}?v=${CONFLICTING_VIDEO_ID}`, VIDEO_ID],
		[`https://youtube.com/embed/${VIDEO_ID}?v=${CONFLICTING_VIDEO_ID}`, VIDEO_ID],
		[`https://youtube.com/v/${VIDEO_ID}?v=${CONFLICTING_VIDEO_ID}`, VIDEO_ID],
		[`https://youtube.com/live/${VIDEO_ID}?v=${CONFLICTING_VIDEO_ID}`, VIDEO_ID],
	] as const)('uses the path-scoped video id for %s', (url, expected) => {
		expect(canonicalYouTubeVideoId(url)).toBe(expected);
	});

	test.each([
		`https://www.youtube.com/watch?v=${VIDEO_ID}`,
		`https://m.youtube.com/watch?v=${VIDEO_ID}`,
		`https://music.youtube.com/watch?v=${VIDEO_ID}`,
		`https://youtu.be/${VIDEO_ID}?v=${CONFLICTING_VIDEO_ID}`,
	])('normalizes supported YouTube hosts for %s', (url) => {
		expect(canonicalYouTubeVideoId(url)).toBe(VIDEO_ID);
	});
});
