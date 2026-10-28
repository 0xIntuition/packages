import { beforeEach, describe, expect, it } from 'bun:test';

import { createClassificationEngine } from '../src/engine';
import {
	createDefaultUrlPlugin,
	createV0TypeProfilesPlugin,
	createXDomainApiAdapter,
	createXOpenGraphAdapter,
	createXPlugin,
	createXPublicMetadataAdapter,
} from '../src/index';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../src/plugins/shared/domain-html/fetch';
import { createDefaultTestPlugins } from './helpers/default-plugins';
import { resolvePublicTestHostname } from './helpers/public-dns';

// default-url now optionally fetches OpenGraph metadata (ENG-13195); pass a
// non-network stub so this test never touches globalThis.fetch even though
// the x classifier is expected to win before default-url's resolver runs.
const NO_NETWORK_FETCH = async () => new Response(null, { status: 404 });

describe('x plugin', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
	});

	it('names the open host and breaker state in the public-metadata classify diagnostic', async () => {
		let fetchCallCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						publicMetadata: createXPublicMetadataAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => {
								fetchCallCount += 1;
								return new Response('', { status: 503 });
							},
						}),
					},
				}),
			],
		});

		let finalResult: Awaited<ReturnType<typeof engine.classify>> | undefined;
		for (let index = 0; index < 4; index += 1) {
			finalResult = await engine.classify({
				input: `https://x.com/0xIntuition/status/192050517088821670${index}`,
				mode: 'progressive',
				classificationSessionId: `x-public-metadata-open-${index}`,
			});
		}

		expect(fetchCallCount).toBe(3);
		expect(finalResult?.resolverErrors?.map((error) => error.message).join('\n')).toMatch(
			/public-metadata:circuit_open: Host cdn\.syndication\.twimg\.com circuit is open \(failures=3, openForMs=\d+, resetAfterMs=300000\)/
		);
	});

	it('keeps X status URLs as SocialMediaPosting through the default preset with or without metadata (ENG-13374)', async () => {
		const input = 'https://x.com/0xIntuition/status/1920505170888216700';
		const identityOnlyEngine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: createDefaultTestPlugins(),
		});
		const enrichedEngine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: createDefaultTestPlugins({
				xPluginOptions: {
					adapters: {
						publicMetadata: createXPublicMetadataAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(JSON.stringify(X_PUBLIC_JSON_TWEET)),
						}),
					},
				},
			}),
		});

		const identityOnly = await identityOnlyEngine.classify({
			input,
			mode: 'progressive',
			classificationSessionId: 'x-default-preset-identity-only',
		});
		const enriched = await enrichedEngine.classify({
			input,
			mode: 'progressive',
			classificationSessionId: 'x-default-preset-enriched',
		});

		for (const result of [identityOnly, enriched]) {
			expect(result.classification).toMatchObject({
				domain: 'x',
				subtype: 'post',
				meta: {
					postId: '1920505170888216700',
					canonicalUrl: input,
				},
			});
			expect(result.resolved?.atoms[0]).toMatchObject({
				schemaType: 'SocialMediaPosting',
				category: 'thing',
				canonicalId: 'x:post:1920505170888216700',
				sameAs: [input],
				data: {
					'@type': 'SocialMediaPosting',
					identifier: '1920505170888216700',
					url: input,
					sameAs: [input],
				},
			});
		}

		expect(identityOnly.resolved?.atoms[0]?.metadata).toMatchObject({
			resolutionMode: 'identity-only',
			fallbackStage: 'generic',
		});
		expect(enriched.resolved?.atoms[0]?.metadata).toMatchObject({
			resolutionMode: 'enriched',
			fallbackStage: 'public-metadata',
		});
		expect(enriched.resolved?.atoms[0]?.data.text).toBe('Atoms are social objects.');
	});

	// ENG-13569: two X profile URLs created back-to-back resolved to different
	// categories (Person vs Thing). Root cause: the x classifier required an
	// absolute URL (scheme required), so a profile pasted/typed without
	// "https://" fell through to the generic default-url plugin's Website/thing
	// fallback instead of the platform's deterministic identity-only Person
	// fallback — a URL-shape-dependent type flip, not a fetch-dependent one.
	it('classifies a schemeless x profile URL as Person, not the generic default-url fallback', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
				}),
				createDefaultUrlPlugin({ fetch: NO_NETWORK_FETCH }),
			],
		});

		const result = await engine.classify({
			input: 'x.com/0xIntuition',
			mode: 'progressive',
			classificationSessionId: 'x-schemeless-profile',
		});

		expect(result.classification?.domain).toBe('x');
		expect(result.classification?.subtype).toBe('profile');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
		expect(result.resolved?.atoms[0]?.category).toBe('person');
	});

	// Phase 3 determinism guard: an X profile must resolve to Person even when
	// every enrichment stage fails outright — the type decision comes from the
	// URL shape, never from whether metadata could be fetched.
	it('never returns a category other than person for a profile URL even when every adapter throws', async () => {
		const throwingFetch = async () => {
			throw new Error('network unavailable');
		};
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					adapters: {
						domainApi: createXDomainApiAdapter({ token: 'test-token', fetch: throwingFetch }),
						publicMetadata: createXPublicMetadataAdapter({ fetch: throwingFetch }),
						openGraph: createXOpenGraphAdapter({ fetch: throwingFetch }),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition',
			mode: 'progressive',
			classificationSessionId: 'x-fetch-failure',
		});

		expect(result.resolved?.atoms[0]?.category).toBe('person');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
	});

	it('returns identity-only post output without fabricating tweet text', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'x-identity-only',
		});

		expect(result.status).toBe('complete');
		expect(result.classification?.domain).toBe('x');
		expect(result.classification?.subtype).toBe('post');
		expect(result.resolved?.fallbackUsed).toBe(true);
		expect(result.resolved?.atoms[0]?.title).toBe('X Post by @0xIntuition');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('x:post:1920505170888216700');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'x',
			provider: 'x',
			resolutionMode: 'identity-only',
			fallbackStage: 'generic',
		});
		expect(result.resolved?.atoms[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'SocialMediaPosting',
			name: 'X Post by @0xIntuition',
			url: 'https://x.com/0xIntuition/status/1920505170888216700',
			sameAs: ['https://x.com/0xIntuition/status/1920505170888216700'],
			identifier: '1920505170888216700',
			alternateName: '@0xIntuition',
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'SocialMediaPosting',
			name: 'X Post by @0xIntuition',
			url: 'https://x.com/0xIntuition/status/1920505170888216700',
			sameAs: ['https://x.com/0xIntuition/status/1920505170888216700'],
			identifier: '1920505170888216700',
			alternateName: '@0xIntuition',
		});
	});

	it('treats the default domain-api adapter without credentials as a clean miss', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition',
			mode: 'progressive',
			classificationSessionId: 'x-domain-api-no-credential-clean-miss',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
		expect(result.resolverErrors ?? []).toEqual([]);
	});

	it('treats a profile passed to post-only public metadata as a clean miss', async () => {
		let fetchCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						publicMetadata: createXPublicMetadataAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => {
								fetchCount += 1;
								return new Response('{}');
							},
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition',
			mode: 'progressive',
			classificationSessionId: 'x-profile-public-metadata-clean-miss',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
		expect(result.resolverErrors ?? []).toEqual([]);
		expect(fetchCount).toBe(0);
	});

	it('treats an X tombstone response as a clean miss', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						publicMetadata: createXPublicMetadataAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(JSON.stringify({ __typename: 'TweetTombstone' })),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'x-tombstone-clean-miss',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaPosting');
		expect(result.resolverErrors ?? []).toEqual([]);
	});

	it('uses the official x domain api adapter to enrich publishable post content', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						domainApi: createXDomainApiAdapter({
							token: 'test-token',
							fetch: async (input: string) => ({
								ok: true,
								status: 200,
								json: async () =>
									input.includes('/tweets?')
										? X_DOMAIN_API_POST_PAYLOAD
										: X_DOMAIN_API_USER_PAYLOAD,
								text: async () => '',
							}),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'x-domain-api',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.fallbackUsed).toBe(false);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(result.resolved?.atoms[0]?.title).toBe('X Post by @0xIntuition');
		expect(result.resolved?.atoms[0]?.description).toBe('Introducing: $TRUST.');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'x',
			provider: 'x-api-v2',
			resolutionMode: 'enriched',
			sourceFamily: 'domain-api',
			fallbackStage: 'domain-api',
		});
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			name: 'X Post by @0xIntuition',
			text: 'Introducing: $TRUST.',
			identifier: '1920505170888216700',
			datePublished: '2025-05-08T15:44:48.000Z',
			author: {
				name: 'Intuition',
				identifier: 'x:user:0xintuition',
			},
			media: ['https://pbs.twimg.com/amplify_video_thumb/1920230250094419968/img/example.jpg'],
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'SocialMediaPosting',
			name: 'X Post by @0xIntuition',
			url: 'https://x.com/0xIntuition/status/1920505170888216700',
			sameAs: ['https://x.com/0xIntuition/status/1920505170888216700'],
			identifier: '1920505170888216700',
			alternateName: '@0xIntuition',
			text: 'Introducing: $TRUST.',
			author: {
				name: 'Intuition',
				identifier: 'x:user:0xintuition',
				url: 'https://x.com/0xIntuition',
				sameAs: ['https://x.com/0xIntuition'],
			},
			datePublished: '2025-05-08T15:44:48.000Z',
		});
	});

	it('promotes approved rich-public fields from structured public metadata', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						publicMetadata: createXPublicMetadataAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(JSON.stringify(X_PUBLIC_JSON_TWEET)),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'x-public-metadata',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.fallbackUsed).toBe(true);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:public-metadata');
		expect(result.resolved?.atoms[0]?.title).toBe('X Post by @0xIntuition');
		expect(result.resolved?.atoms[0]?.description).toBe('Atoms are social objects.');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'x',
			provider: 'x-syndication',
			resolutionMode: 'enriched',
			sourceFamily: 'public-json',
			fallbackStage: 'public-metadata',
		});
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			name: 'X Post by @0xIntuition',
			text: 'Atoms are social objects.',
			identifier: '1920505170888216700',
			datePublished: '2026-04-02T00:00:00.000Z',
			author: {
				name: 'Intuition',
				identifier: 'x:user:0xintuition',
			},
			media: ['https://pbs.twimg.com/media/example.jpg'],
		});
		expect(result.resolved?.publishable[0]?.meta).toMatchObject({
			provider: 'x-syndication',
			resolutionMode: 'enriched',
			sourceFamily: 'public-json',
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'SocialMediaPosting',
			name: 'X Post by @0xIntuition',
			url: 'https://x.com/0xIntuition/status/1920505170888216700',
			sameAs: ['https://x.com/0xIntuition/status/1920505170888216700'],
			identifier: '1920505170888216700',
			alternateName: '@0xIntuition',
			text: 'Atoms are social objects.',
			author: {
				name: 'Intuition',
				identifier: 'x:user:0xintuition',
				url: 'https://x.com/0xIntuition',
				sameAs: ['https://x.com/0xIntuition'],
			},
			datePublished: '2026-04-02T00:00:00.000Z',
		});
	});

	it('uses the optional enrichment adapter when x credentials are configured', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					credentials: {
						x: { token: 'test-token' },
					},
					useDefaultDomainApiAdapter: false,
					enrichment: async ({ canonicalUrl, handle, postId }) => ({
						provider: 'x-test-provider',
						canonicalUrl,
						text: 'Structured X content from provider',
						authorName: 'Intuition',
						authorHandle: handle,
						authorImage: 'https://example.com/avatar.png',
						media: ['https://example.com/image.png'],
						replyToPostId: postId,
					}),
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'x-enriched',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.fallbackUsed).toBe(false);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(result.resolved?.atoms[0]?.title).toBe('X Post by @0xIntuition');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'x',
			provider: 'x-test-provider',
			resolutionMode: 'enriched',
			fallbackStage: 'domain-api',
		});
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			name: 'X Post by @0xIntuition',
			text: 'Structured X content from provider',
			identifier: '1920505170888216700',
			media: ['https://example.com/image.png'],
			replyToPostId: '1920505170888216700',
		});
		expect(result.resolved?.publishable[0]?.meta).toMatchObject({
			provider: 'x-test-provider',
			resolutionMode: 'enriched',
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'SocialMediaPosting',
			name: 'X Post by @0xIntuition',
			url: 'https://x.com/0xIntuition/status/1920505170888216700',
			sameAs: ['https://x.com/0xIntuition/status/1920505170888216700'],
			identifier: '1920505170888216700',
		});
	});

	it('uses the x opengraph adapter opportunistically without expanding publishable text', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createXPlugin({
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						openGraph: createXOpenGraphAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(X_POST_OPEN_GRAPH_HTML),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'x-opengraph',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.fallbackUsed).toBe(true);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:opengraph');
		expect(result.resolved?.atoms[0]?.title).toBe('X Post by @0xIntuition');
		expect(result.resolved?.atoms[0]?.description).toBe('Atoms are social objects.');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'x',
			provider: 'x-opengraph',
			resolutionMode: 'identity-only',
			fallbackStage: 'opengraph',
		});
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			name: 'X Post by @0xIntuition',
			text: 'Atoms are social objects.',
			identifier: '1920505170888216700',
			author: {
				name: '@0xIntuition',
				identifier: 'x:user:0xintuition',
			},
		});
		expect(result.resolved?.publishable[0]?.meta).toMatchObject({
			provider: 'x-opengraph',
			resolutionMode: 'identity-only',
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'SocialMediaPosting',
			name: 'X Post by @0xIntuition',
			url: 'https://x.com/0xIntuition/status/1920505170888216700',
			sameAs: ['https://x.com/0xIntuition/status/1920505170888216700'],
			identifier: '1920505170888216700',
			alternateName: '@0xIntuition',
		});
	});
});

const X_POST_OPEN_GRAPH_HTML = `
<html>
	<head>
		<meta property="og:title" content="0xIntuition on X" />
		<meta property="og:description" content="Atoms are social objects." />
		<meta property="og:image" content="https://pbs.twimg.com/media/example.jpg" />
		<meta property="og:url" content="https://x.com/0xIntuition/status/1920505170888216700" />
		<title>0xIntuition on X: "Atoms are social objects."</title>
	</head>
</html>
`;

const X_PUBLIC_JSON_TWEET = {
	__typename: 'Tweet',
	text: 'Atoms are social objects.',
	created_at: '2026-04-02T00:00:00.000Z',
	user: {
		screen_name: '0xIntuition',
		name: 'Intuition',
		profile_image_url_https: 'https://pbs.twimg.com/profile_images/example.jpg',
	},
	photos: [
		{
			url: 'https://pbs.twimg.com/media/example.jpg',
		},
	],
};

const X_DOMAIN_API_POST_PAYLOAD = {
	data: [
		{
			author_id: '1489350103840219144',
			id: '1920505170888216700',
			text: 'Introducing: $TRUST.',
			created_at: '2025-05-08T15:44:48.000Z',
		},
	],
	includes: {
		media: [
			{
				preview_image_url:
					'https://pbs.twimg.com/amplify_video_thumb/1920230250094419968/img/example.jpg',
			},
		],
		users: [
			{
				id: '1489350103840219144',
				username: '0xIntuition',
				name: 'Intuition',
				profile_image_url: 'https://pbs.twimg.com/profile_images/example_normal.jpg',
			},
		],
	},
};

const X_DOMAIN_API_USER_PAYLOAD = {
	data: {
		id: '1489350103840219144',
		username: '0xIntuition',
		name: 'Intuition',
		profile_image_url: 'https://pbs.twimg.com/profile_images/example_normal.jpg',
	},
};
