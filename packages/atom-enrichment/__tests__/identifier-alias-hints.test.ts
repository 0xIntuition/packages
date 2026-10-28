import { describe, expect, test } from 'bun:test';
import { resolveIdentifierHints } from '../src/identifier';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';
import {
	createPodcastIndexPlugin,
	resolvePodcastIndexTarget,
} from '../src/plugins/providers/podcast-index';
import { createMockPluginContext, createMockRequest } from '../src/testing';

describe('podcast provider-local alias hints', () => {
	test('maps Apple Podcasts handles to the numeric itunesId', () => {
		expect(resolveIdentifierHints({ identifier: { iid: 'int:apple-podcasts:123' } })).toEqual({
			itunesId: '123',
		});
	});
	test('maps Podcast Index handles to podcastIndexFeedId', () => {
		expect(resolveIdentifierHints({ identifier: { iid: 'int:podcast-index:123' } })).toEqual({
			podcastIndexFeedId: '123',
		});
	});
	test('feed-id hints activate the existing Podcast Index feed-id lookup', async () => {
		const urls: string[] = [];
		const plugin = createPodcastIndexPlugin({
			apiKey: 'fixture-key',
			apiSecret: 'fixture-secret',
			fetch: createPinAwareFetch(async (url) => {
				urls.push(String(url));
				return new Response(JSON.stringify({ status: 'true', feed: [] }), {
					headers: { 'content-type': 'application/json' },
				});
			}),
		});
		const request = createMockRequest({
			input: {
				atomType: 'thing',
				jsonLd: { '@type': 'PodcastSeries' },
				source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
				hints: { identifiers: { podcastIndexFeedId: '123' } },
			},
		});
		expect(resolvePodcastIndexTarget(request)).toEqual({ kind: 'feedId', value: '123' });
		expect(plugin.supports(request)).toBe(true);
		await plugin.enrich(request, createMockPluginContext());
		expect(urls).toEqual(['https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=123']);
		expect(
			plugin.supports({
				...request,
				input: { ...request.input, hints: { identifiers: { podcastIndexFeedId: 'invalid' } } },
			})
		).toBe(false);
	});
});
