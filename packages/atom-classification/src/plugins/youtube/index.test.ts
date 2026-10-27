import { afterEach, describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createClassificationEngine } from '../../engine';
import { createDefaultUrlPlugin } from '../default-url';
import { createTypeProfilesPlugin } from '../type-profiles';
import {
	canonicalYouTubeVideoId,
	createYouTubePlugin,
	parseYouTubeVideoId,
	YOUTUBE_VIDEO_ID_PATTERN,
} from './index';
import { createYouTubeOEmbedAdapter } from './oembed-adapter';

// The shared provider hop resolves every target before it dials; no network is used.
useStubbedPublicDns();

const globals = globalThis as typeof globalThis & { fetch?: typeof fetch };
const originalFetch = globals.fetch;
const mutableGlobals = globalThis as unknown as Record<string, unknown>;

afterEach(() => {
	if (originalFetch) {
		globals.fetch = originalFetch;
		return;
	}

	Reflect.deleteProperty(mutableGlobals, 'fetch');
});

describe('youtube plugin', () => {
	it('exports the single parser used for canonical YouTube video identity', () => {
		const parsed = new URL('https://www.youtube.com/embed/u4ZoJKF_VuA?feature=share');

		expect(parseYouTubeVideoId(parsed)).toBe('u4ZoJKF_VuA');
		expect(canonicalYouTubeVideoId(parsed)).toBe('u4ZoJKF_VuA');
		expect(canonicalYouTubeVideoId(parsed.toString())).toBe('u4ZoJKF_VuA');
		expect(canonicalYouTubeVideoId('not a URL')).toBeUndefined();
		expect(YOUTUBE_VIDEO_ID_PATTERN.test('u4ZoJKF_VuA')).toBe(true);
		expect(YOUTUBE_VIDEO_ID_PATTERN.test('u4ZoJKF_Vu')).toBe(false);
	});

	it.each([
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtu.be/dQw4w9WgXcQ',
		'https://www.youtube.com/shorts/dQw4w9WgXcQ',
		'https://www.youtube.com/embed/dQw4w9WgXcQ',
		'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
	])('normalizes deterministic video URL shape %s to one canonical identity', async (input) => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'client',
			plugins: [
				createTypeProfilesPlugin(),
				createYouTubePlugin({ useDefaultOEmbedAdapter: false }),
				createDefaultUrlPlugin(),
			],
		});
		const result = await engine.classify({
			input,
			mode: 'progressive',
			classificationSessionId: `youtube-url-shape-${input}`,
		});

		expect(result.classification?.domain).toBe('youtube');
		expect(result.resolved?.resolverId).toBe('youtube-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'VideoObject',
			category: 'thing',
			canonicalId: 'youtube:video:dQw4w9WgXcQ',
			metadata: {
				sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			},
		});
	});

	it.each([
		'https://www.youtube.com/@OpenAI',
		'https://www.youtube.com/playlist?list=PL1234567890',
		'https://music.youtube.com/playlist?list=PL1234567890',
		'https://music.youtube.com/channel/UC1234567890',
		'https://music.youtube.com/browse/VLPL1234567890',
		'https://music.youtube.com/',
		'https://evilmusic.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://music.youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
	])('declines ambiguous non-video URL shape %s', async (input) => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'client',
			plugins: [
				createTypeProfilesPlugin(),
				createYouTubePlugin({ useDefaultOEmbedAdapter: false }),
				createDefaultUrlPlugin(),
			],
		});
		const result = await engine.classify({
			input,
			mode: 'progressive',
			classificationSessionId: `youtube-non-video-shape-${input}`,
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('WebSite');
	});

	it('uses the default oEmbed adapter to resolve video title and URL', async () => {
		let fetchCalls = 0;
		const fetch = createPinAwareFetch(async (input: string) => {
			fetchCalls += 1;
			expect(input).toContain('https://www.youtube.com/oembed');
			expect(input).toContain('url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ');

			return Response.json({
				title: 'Never Gonna Give You Up',
				author_name: 'Rick Astley',
				thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
			});
		});

		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createYouTubePlugin({ adapters: { oEmbed: createYouTubeOEmbedAdapter({ fetch }) } }),
			],
		});
		const result = await engine.classify({
			input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			mode: 'progressive',
			classificationSessionId: 'youtube-default-oembed',
		});

		expect(fetchCalls).toBe(1);
		expect(result.classification?.domain).toBe('youtube');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:oembed');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('VideoObject');
		expect(result.resolved?.atoms[0]?.title).toBe('Never Gonna Give You Up');
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'VideoObject',
			name: 'Never Gonna Give You Up',
			url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'VideoObject',
			name: 'Never Gonna Give You Up',
			url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			sameAs: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
		});
	});

	it('can disable the default oEmbed adapter and resolve deterministically', async () => {
		let fetchCalls = 0;
		globals.fetch = ((input: RequestInfo | URL) => {
			fetchCalls += 1;
			throw new Error(`should not fetch ${String(input)}`);
		}) as unknown as typeof fetch;

		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createYouTubePlugin({ useDefaultOEmbedAdapter: false }),
			],
		});
		const result = await engine.classify({
			input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			mode: 'progressive',
			classificationSessionId: 'youtube-generic-fallback',
		});

		expect(fetchCalls).toBe(0);
		expect(result.classification?.domain).toBe('youtube');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolved?.atoms[0]?.title).toBe('YouTube Video dQw4w9WgXcQ');
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'VideoObject',
			name: 'YouTube Video dQw4w9WgXcQ',
			contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		});
	});

	for (const fixture of [
		{ status: 503, diagnostic: 'oembed:non_ok_status: HTTP 503' },
		{ status: 404, diagnostic: undefined },
	] as const) {
		it(`preserves generic fallback with status-aware handling for HTTP ${fixture.status}`, async () => {
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				runtime: 'server',
				plugins: [
					createTypeProfilesPlugin(),
					createYouTubePlugin({
						adapters: {
							oEmbed: createYouTubeOEmbedAdapter({
								fetch: createPinAwareFetch(
									async () => new Response('{}', { status: fixture.status })
								),
							}),
						},
					}),
				],
			});

			const result = await engine.classify({
				input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				mode: 'progressive',
				classificationSessionId: `youtube-oembed-http-${fixture.status}`,
			});

			expect(result.status).toBe('complete');
			expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
			expect(result.resolved?.atoms[0]?.title).toBe('YouTube Video dQw4w9WgXcQ');
			expect(result.resolverErrors?.map((error) => error.message) ?? []).toEqual(
				fixture.diagnostic ? [fixture.diagnostic] : []
			);
		});
	}
});
