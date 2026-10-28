import { describe, expect, it } from 'bun:test';
import { WIKIMEDIA_USER_AGENT } from '@0xintuition/atom-enrichment/provider-fetch';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import {
	createTypeProfilesPlugin,
	createWikipediaPlugin,
	inferWikipediaTypeFromEvidence,
} from '../src/plugins/index';
import { createServerEngine } from '../src/server';

useStubbedPublicDns();

describe('wikipedia platform plugin', () => {
	it('infers schema types from deterministic summary evidence', () => {
		const fixtures = [
			{
				description: 'American ice hockey goaltender',
				expected: 'Person',
				keyword: 'goaltender',
			},
			{
				description: 'city in northern Italy',
				expected: 'Place',
				keyword: 'city',
			},
			{
				description: 'collection of Buddhist texts',
				expected: 'Book',
				keyword: 'buddhist texts',
			},
			{
				description: 'American daily newspaper',
				expected: 'Newspaper',
				keyword: 'daily newspaper',
			},
			{
				description: 'American news organization',
				expected: 'Organization',
				keyword: 'news organization',
			},
			{
				description: 'handheld video game console',
				expected: 'Product',
				keyword: 'video game console',
			},
			{
				description: 'free software application',
				expected: 'SoftwareApplication',
				keyword: 'software application',
			},
			{
				description: 'official currency of Exampleland',
				expected: 'Thing',
				keyword: 'currency',
			},
		] as const;

		for (const fixture of fixtures) {
			const inferred = inferWikipediaTypeFromEvidence({ description: fixture.description });
			expect(inferred.schemaType).toBe(fixture.expected);
			expect(inferred.keyword).toBe(fixture.keyword);
		}
	});

	it('resolves Wikipedia summary evidence through the domain-api stage', async () => {
		const calls: Array<{ input: string; headers: Headers }> = [];
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			now: () => new Date('2026-07-13T00:00:00.000Z'),
			plugins: [
				createTypeProfilesPlugin(),
				createWikipediaPlugin({
					fetch: createPinAwareFetch(async (input, init) => {
						calls.push({ input, headers: new Headers(init?.headers) });
						return Response.json({
							title: 'Manon Rheaume',
							description: 'Canadian ice hockey goaltender',
							extract: 'Manon Rheaume is a Canadian former ice hockey goaltender.',
							content_urls: {
								desktop: {
									page: 'https://en.wikipedia.org/wiki/Manon_Rh%C3%A9aume',
								},
							},
							wikibase_item: 'Q257145',
						});
					}),
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://en.wikipedia.org/wiki/Manon_Rh%C3%A9aume',
			mode: 'progressive',
			classificationSessionId: 'wikipedia-summary-person',
		});

		const atom = result.resolved?.atoms[0];
		expect(calls).toHaveLength(1);
		expect(calls[0]?.input).toBe(
			'https://en.wikipedia.org/api/rest_v1/page/summary/Manon%20Rh%C3%A9aume'
		);
		expect(calls[0]?.headers.get('user-agent')).toBe(WIKIMEDIA_USER_AGENT);
		expect(engine.getLastMetadata().platformResolver).toMatchObject({
			domain: 'wikipedia',
			fallbackStage: 'domain-api',
			attemptedStages: ['domain-api'],
		});
		expect(atom).toMatchObject({
			schemaType: 'Person',
			category: 'person',
			title: 'Manon Rheaume',
			description: 'Canadian ice hockey goaltender',
			canonicalId: 'wikipedia:manon-rheaume',
			source: 'platform-v0:domain-api',
		});
		expect(atom?.data).toMatchObject({
			'@type': 'Person',
			name: 'Manon Rheaume',
			identifier: 'Q257145',
			sameAs: [
				'https://en.wikipedia.org/wiki/Manon_Rh%C3%A9aume',
				'https://www.wikidata.org/wiki/Q257145',
			],
		});
		expect(atom?.metadata).toMatchObject({
			pluginId: 'wikipedia',
			provider: 'wikipedia-rest-summary',
			platform: 'wikipedia',
			subtype: 'article',
			sourceFamily: 'domain-api',
			fallbackStage: 'domain-api',
			wikipediaTyping: {
				schemaType: 'Person',
				reason: 'wikipedia-description-person',
				evidenceSource: 'description',
				keyword: 'goaltender',
			},
		});
	});

	it('keeps the title-only generic fallback available when the domain-api adapter is disabled', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			now: () => new Date('2026-07-13T00:00:00.000Z'),
			plugins: [
				createTypeProfilesPlugin(),
				createWikipediaPlugin({
					useDefaultDomainApiAdapter: false,
					fetch: createPinAwareFetch(async () => {
						throw new Error('fetch should not be called');
					}),
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://en.wikipedia.org/wiki/Notion_(software)',
			mode: 'progressive',
			classificationSessionId: 'wikipedia-generic-software',
		});

		expect(engine.getLastMetadata().platformResolver).toMatchObject({
			domain: 'wikipedia',
			fallbackStage: 'generic',
			attemptedStages: ['oembed', 'opengraph', 'generic'],
			skippedStages: ['domain-api:no-credentials'],
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'SoftwareApplication',
			category: 'software',
			title: 'Notion (software)',
			source: 'platform-v0:generic',
		});
	});

	for (const fixture of [
		{ status: 503, diagnostic: 'domain-api:non_ok_status: HTTP 503' },
		{ status: 404, diagnostic: undefined },
	] as const) {
		it(`preserves generic fallback with status-aware handling for HTTP ${fixture.status}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				now: () => new Date('2026-07-13T00:00:00.000Z'),
				plugins: [
					createTypeProfilesPlugin(),
					createWikipediaPlugin({
						fetch: createPinAwareFetch(
							async () =>
								// A body that errors when read: a non-OK response must never be read.
								new Response(
									new ReadableStream({
										pull() {
											throw new Error('non-OK response body must not be read');
										},
									}),
									{ status: fixture.status }
								)
						),
					}),
				],
			});

			const result = await engine.classify({
				input: 'https://en.wikipedia.org/wiki/Notion_(software)',
				mode: 'progressive',
				classificationSessionId: `wikipedia-domain-api-http-${fixture.status}`,
			});

			expect(result.status).toBe('complete');
			expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
			expect(result.resolved?.atoms[0]?.title).toBe('Notion (software)');
			expect(result.resolverErrors?.map((error) => error.message) ?? []).toEqual(
				fixture.diagnostic ? [fixture.diagnostic] : []
			);
		});
	}
});
