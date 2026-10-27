import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createClassificationEngine } from '../src/engine';
import {
	createGitHubDomainApiAdapter,
	createGitHubPlugin,
	createSpotifyDomainApiAdapter,
	createSpotifyPlugin,
	createV0TypeProfilesPlugin,
	createXDomainApiAdapter,
	createYouTubeOEmbedAdapter,
} from '../src/plugins/index';
import { defaultClassificationPreset } from '../src/presets/default';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';
import { legacySpotifyFetch } from './helpers/legacy-spotify-fetch';

// The shared provider hop resolves every target before it dials; no network is used.
useStubbedPublicDns();

describe('v0 platform coverage', () => {
	const fixtures = [
		{
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			domain: 'spotify',
			schemaType: 'MusicRecording',
			category: 'song',
		},
		{
			input: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
			domain: 'spotify',
			schemaType: 'PodcastSeries',
			category: 'podcast',
		},
		{
			input: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
			domain: 'spotify',
			schemaType: 'PodcastEpisode',
			category: 'podcast',
		},
		{
			input: 'https://github.com/openai/openai-node',
			domain: 'github',
			schemaType: 'SoftwareSourceCode',
			category: 'software',
		},
		{
			input: 'https://x.com/intuition/status/123456789',
			domain: 'x',
			schemaType: 'SocialMediaPosting',
			category: 'thing',
		},
		{
			input: 'https://www.instagram.com/reel/C4f6h1M0abc/',
			domain: 'instagram',
			schemaType: 'VideoObject',
			category: 'thing',
		},
		{
			input: 'https://www.tiktok.com/@intuition/video/7345678901234567890',
			domain: 'tiktok',
			schemaType: 'VideoObject',
			category: 'thing',
		},
		{
			input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			domain: 'youtube',
			schemaType: 'VideoObject',
			category: 'thing',
		},
		{
			input: 'https://en.wikipedia.org/wiki/Notion_(software)',
			domain: 'wikipedia',
			schemaType: 'SoftwareApplication',
			category: 'software',
		},
		{
			input: 'https://www.imdb.com/title/tt0133093/',
			domain: 'imdb',
			schemaType: 'Movie',
			category: 'thing',
		},
		{
			input: 'https://www.themoviedb.org/tv/1396-breaking-bad',
			domain: 'tmdb',
			schemaType: 'TVSeries',
			category: 'thing',
		},
		{
			input: 'https://openlibrary.org/works/OL45804W/The_Lord_of_the_Rings',
			domain: 'openlibrary',
			schemaType: 'Book',
			category: 'thing',
		},
		{
			input: 'https://store.steampowered.com/app/570/Dota_2/',
			domain: 'steam',
			schemaType: 'VideoGame',
			category: 'thing',
		},
		{
			input: 'https://coingecko.com/en/coins/bitcoin',
			domain: 'coingecko',
			schemaType: 'Cryptocurrency',
			category: 'thing',
		},
		{
			input: 'https://coinmarketcap.com/currencies/bitcoin/',
			domain: 'coinmarketcap',
			schemaType: 'Cryptocurrency',
			category: 'thing',
		},
		{
			input: 'https://www.etsy.com/listing/1234567890/handmade-blue-mug',
			domain: 'etsy',
			schemaType: 'Product',
			category: 'product',
		},
		{
			input: 'https://acme-store.myshopify.com/products/handmade-blue-mug',
			domain: 'shopify',
			schemaType: 'Product',
			category: 'product',
		},
	] as const;

	for (const fixture of fixtures) {
		it(`classifies and resolves ${fixture.domain} URLs`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});
			const result = await engine.classify({
				input: fixture.input,
				mode: 'progressive',
				classificationSessionId: `fixture-${fixture.domain}`,
			});

			expect(result.status).toBe(fixture.domain === 'imdb' ? 'partial' : 'complete');
			expect(result.classification?.domain).toBe(fixture.domain);
			if (fixture.domain === 'imdb') {
				expect(result.resolved?.atoms ?? []).toHaveLength(0);
				return;
			}
			expect(result.resolved?.resolverId).toBe(`${fixture.domain}-resolver`);
			expect(result.resolved?.atoms[0]?.schemaType).toBe(fixture.schemaType);
			expect(result.resolved?.atoms[0]?.category).toBe(fixture.category);
			expect(result.resolved?.atoms[0]?.data.sameAs).toEqual(result.resolved?.atoms[0]?.sameAs);
			expect(result.resolved?.classifications[0]?.data.sameAs).toEqual(
				result.resolved?.atoms[0]?.sameAs
			);
			expect(result.resolved?.dedupeKey).toContain('canonical:');
		});
	}

	it('covers all required v0 taxonomy buckets with deterministic fixtures', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const taxonomyFixtures = [
			'https://x.com/intuition',
			'https://en.wikipedia.org/wiki/Paris_(city)',
			'https://www.themoviedb.org/movie/603',
			'https://en.wikipedia.org/wiki/OpenAI_(company)',
			'erc20:0x1111111111111111111111111111111111111111',
			'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
			'https://en.wikipedia.org/wiki/Notion_(software)',
		] as const;

		const categories = new Set<string>();
		for (const input of taxonomyFixtures) {
			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `taxonomy-${slug(input)}`,
			});
			categories.add(result.resolved?.atoms[0]?.category ?? '');
		}

		expect(categories).toEqual(
			new Set(['person', 'place', 'thing', 'company', 'product', 'song', 'podcast', 'software'])
		);
	});

	it('uses domain-api stage when credentials are configured', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: {
						spotify: { apiKey: 'test-key' },
					},
					adapters: {
						domainApi: ({ domain, canonicalUrl }) => {
							if (domain !== 'spotify') {
								return null;
							}

							return {
								schemaType: 'MusicRecording',
								category: 'song',
								title: 'Spotify Domain API Result',
								canonicalId: 'spotify:track:domain-api',
								sameAs: [canonicalUrl],
							};
						},
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			mode: 'progressive',
			classificationSessionId: 'stage-domain-api',
		});

		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(result.resolved?.atoms[0]?.title).toBe('Spotify Domain API Result');
		expect(result.resolved?.fallbackUsed).toBe(false);
		const metadata = engine.getLastMetadata();
		const platformMetadata = metadata.platformResolver as {
			fallbackStage?: string;
			attemptedStages?: string[];
		};
		expect(platformMetadata.fallbackStage).toBe('domain-api');
		expect(platformMetadata.attemptedStages).toEqual(['domain-api']);
	});

	it('uses domain-api stage without credentials when the platform allows public api access', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createGitHubPlugin({
					adapters: {
						domainApi: createGitHubDomainApiAdapter({
							fetch: async () => ({
								ok: true,
								status: 200,
								json: async () => ({
									full_name: 'openai/openai-node',
									html_url: 'https://github.com/openai/openai-node',
									owner: { login: 'openai' },
								}),
							}),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://github.com/openai/openai-node',
			mode: 'progressive',
			classificationSessionId: 'stage-domain-api-public-github',
		});

		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(result.resolved?.atoms[0]?.title).toBe('openai/openai-node');
		expect(result.resolved?.fallbackUsed).toBe(false);
		const metadata = engine.getLastMetadata();
		const platformMetadata = metadata.platformResolver as {
			fallbackStage?: string;
			attemptedStages?: string[];
			skippedStages?: string[];
		};
		expect(platformMetadata.fallbackStage).toBe('domain-api');
		expect(platformMetadata.attemptedStages).toEqual(['domain-api']);
		expect(platformMetadata.skippedStages).toEqual([]);
	});

	it('falls back to oembed when domain api fails', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: {
						spotify: { token: 'token' },
					},
					adapters: {
						domainApi: () => {
							throw new Error('domain api unavailable');
						},
						oEmbed: ({ domain, canonicalUrl }) => {
							if (domain !== 'spotify') {
								return null;
							}

							return {
								schemaType: 'MusicRecording',
								category: 'song',
								title: 'Spotify oEmbed Result',
								canonicalId: 'spotify:track:oembed',
								sameAs: [canonicalUrl],
								data: { isrcCode: 'USQX91300108' },
							};
						},
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			mode: 'progressive',
			classificationSessionId: 'stage-oembed',
		});

		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:oembed');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('spotify:track:4iV5W9uYEdYUVa79Axb7Rh');
		expect(result.resolved?.atoms[0]?.canonicalId).not.toBe('int:isrc:USQX91300108');
		expect(result.resolved?.fallbackUsed).toBe(true);
		const metadata = engine.getLastMetadata();
		const platformMetadata = metadata.platformResolver as {
			fallbackStage?: string;
			stageErrors?: string[];
			attemptedStages?: string[];
		};
		expect(platformMetadata.fallbackStage).toBe('oembed');
		expect(platformMetadata.attemptedStages).toEqual(['domain-api', 'oembed']);
		expect(platformMetadata.stageErrors?.[0]).toContain(
			'domain-api:adapter_error: domain api unavailable'
		);
	});

	it('uses public-metadata before oembed when a structured public source resolves', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: {
						spotify: { token: 'token' },
					},
					adapters: {
						domainApi: () => null,
						publicMetadata: ({ domain, canonicalUrl }) => {
							if (domain !== 'spotify') {
								return null;
							}

							return {
								schemaType: 'MusicRecording',
								category: 'song',
								title: 'Spotify Public Metadata Result',
								canonicalId: 'spotify:track:public-metadata',
								sameAs: [canonicalUrl],
							};
						},
						oEmbed: ({ domain, canonicalUrl }) => {
							if (domain !== 'spotify') {
								return null;
							}

							return {
								schemaType: 'MusicRecording',
								category: 'song',
								title: 'Spotify oEmbed Result',
								canonicalId: 'spotify:track:oembed',
								sameAs: [canonicalUrl],
							};
						},
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			mode: 'progressive',
			classificationSessionId: 'stage-public-metadata',
		});

		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:public-metadata');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('spotify:track:4iV5W9uYEdYUVa79Axb7Rh');
		expect(result.resolved?.fallbackUsed).toBe(true);
		const metadata = engine.getLastMetadata();
		const platformMetadata = metadata.platformResolver as {
			fallbackStage?: string;
			attemptedStages?: string[];
		};
		expect(platformMetadata.fallbackStage).toBe('public-metadata');
		expect(platformMetadata.attemptedStages).toEqual(['domain-api', 'public-metadata']);
	});

	it('keeps spotify and x domain-api adapters isolated in the default preset', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: defaultClassificationPreset({
				includeDefaultUrlPlugin: false,
				spotifyPluginOptions: {
					credentials: {
						spotify: { apiKey: 'spotify-test-key' },
					},
					adapters: {
						domainApi: ({ domain, canonicalUrl }) => {
							if (domain !== 'spotify') {
								return null;
							}

							return {
								schemaType: 'MusicRecording',
								category: 'song',
								title: 'Spotify Domain API Result',
								canonicalId: 'spotify:track:isolated-domain-api',
								sameAs: [canonicalUrl],
							};
						},
					},
				},
				xPluginOptions: {
					useDefaultDomainApiAdapter: false,
					useDefaultPublicMetadataAdapter: false,
					useDefaultOpenGraphAdapter: false,
					adapters: {
						domainApi: createXDomainApiAdapter({
							token: 'x-test-token',
							fetch: async () => ({
								ok: true,
								status: 200,
								json: async () => X_DOMAIN_API_POST_PAYLOAD,
								text: async () => '',
							}),
						}),
					},
				},
			}),
		});

		const result = await engine.classify({
			input: 'https://x.com/0xIntuition/status/1920505170888216700',
			mode: 'progressive',
			classificationSessionId: 'default-preset-x-domain-api-isolation',
		});

		expect(result.resolved?.fallbackUsed).toBe(false);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(result.resolved?.classifications[0]?.meta.provider).toBe('x-api-v2');
		expect(result.resolved?.publishable[0]?.data.text).toBe('Introducing: $TRUST.');
	});

	it('falls back to generic when credentials are missing and intermediate stages produce no data', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					adapters: {
						oEmbed: () => null,
						openGraph: () => null,
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			mode: 'progressive',
			classificationSessionId: 'stage-generic',
		});

		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolved?.atoms[0]?.metadata?.skippedStages).toContain(
			'domain-api:no-credentials'
		);
		expect(result.resolved?.fallbackUsed).toBe(true);
		const metadata = engine.getLastMetadata();
		const platformMetadata = metadata.platformResolver as {
			fallbackStage?: string;
			skippedStages?: string[];
			attemptedStages?: string[];
		};
		expect(platformMetadata.fallbackStage).toBe('generic');
		expect(platformMetadata.skippedStages).toContain('domain-api:no-credentials');
		expect(platformMetadata.attemptedStages).toEqual(['oembed', 'opengraph', 'generic']);
	});

	for (const fixture of [
		{
			name: 'a configured adapter throws',
			reason: 'adapter_error',
			adapter: () => {
				throw new Error('fixture adapter failure');
			},
		},
		{
			name: 'a configured adapter returns null',
			reason: 'adapter_null',
			adapter: () => null,
		},
	] as const) {
		it(`surfaces ${fixture.reason} while preserving fallback when ${fixture.name}`, async () => {
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				runtime: 'server',
				plugins: [
					createV0TypeProfilesPlugin(),
					createSpotifyPlugin({
						adapters: { openGraph: fixture.adapter },
					}),
				],
			});

			const result = await engine.classify({
				input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
				mode: 'progressive',
				classificationSessionId: `stage-${fixture.reason}`,
			});

			expect(result.status).toBe('complete');
			expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
			expect(result.resolverErrors).toHaveLength(1);
			expect(result.resolverErrors?.[0]?.message).toContain(`opengraph:${fixture.reason}`);
			expect(engine.getLastMetadata()).toMatchObject({
				platformResolver: {
					stageErrors: [expect.stringContaining(`opengraph:${fixture.reason}`)],
				},
			});
		});
	}

	for (const fixture of [
		{
			name: 'a forged miss',
			shape: 'platform_stage_miss',
			adapter: () => ({ kind: 'platform_stage_miss' }) as never,
		},
		{
			name: 'a forged miss with attached data',
			shape: 'platform_stage_miss',
			adapter: () =>
				({
					kind: 'platform_stage_miss',
					atom: { title: 'partial should not vanish' },
					diagnostics: [new Error('attached diagnostic')],
				}) as never,
		},
		{
			name: 'a forged outcome',
			shape: 'platform_stage_outcome',
			adapter: () => ({ kind: 'platform_stage_outcome', atom: null, diagnostics: [] }) as never,
		},
	] as const) {
		it(`fails closed with adapter_error when ${fixture.name} is returned`, async () => {
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				runtime: 'server',
				plugins: [
					createV0TypeProfilesPlugin(),
					createSpotifyPlugin({
						adapters: { openGraph: fixture.adapter },
					}),
				],
			});

			const result = await engine.classify({
				input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
				mode: 'progressive',
				classificationSessionId: `stage-forged-${fixture.shape}`,
			});

			expect(result.status).toBe('complete');
			expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
			expect(result.resolverErrors?.map((error) => error.message)).toEqual([
				expect.stringMatching(new RegExp(`^opengraph:adapter_error: .*${fixture.shape}`)),
			]);
		});
	}

	it('fails closed with adapter_error when a derived object inherits a genuine outcome brand', async () => {
		const { createPlatformStageOutcome } = await import('../src/plugins/shared/platform');
		const genuine = createPlatformStageOutcome(null, []);
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					adapters: { openGraph: () => Object.create(genuine) as never },
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			mode: 'progressive',
			classificationSessionId: 'stage-inherited-outcome-brand',
		});

		expect(result.status).toBe('complete');
		expect(result.resolverErrors).toHaveLength(1);
		expect(result.resolverErrors?.[0]?.message).toContain('expected string');
	});

	it('resolves Spotify track name/artist/album via domain API adapter in createServerEngine', async () => {
		let callCount = 0;
		const fetch = async (input: string) => {
			callCount += 1;

			if (input === 'https://accounts.spotify.com/api/token') {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						access_token: 'spotify-test-token',
					}),
				};
			}

			expect(input).toContain('https://api.spotify.com/v1/tracks/4iV5W9uYEdYUVa79Axb7Rh?market=US');
			return {
				ok: true,
				status: 200,
				json: async () => ({
					id: '4iV5W9uYEdYUVa79Axb7Rh',
					name: 'Never Gonna Give You Up',
					external_ids: { isrc: '  us-qx9-13-00108  ' },
					external_urls: {
						spotify: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
					},
					artists: [
						{
							name: 'Rick Astley',
						},
					],
					album: {
						name: 'Whenever You Need Somebody',
					},
				}),
			};
		};

		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins({
				spotifyPluginOptions: {
					credentials: {
						spotify: {
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
						},
					},
					adapters: {
						domainApi: createSpotifyDomainApiAdapter({
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
							market: 'US',
							fetch: legacySpotifyFetch(fetch),
						}),
					},
				},
			}),
		});

		const result = await engine.classify({
			input: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
			mode: 'progressive',
			classificationSessionId: 'stage-spotify-domain-api',
		});

		expect(callCount).toBe(2);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(result.resolved?.atoms[0]?.title).toBe('Never Gonna Give You Up');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('int:isrc:USQX91300108');
		expect(result.resolved?.atoms[0]?.hints).toMatchObject({
			providerCanonicalIds: ['spotify:track:4iV5W9uYEdYUVa79Axb7Rh'],
		});
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'MusicRecording',
			name: 'Never Gonna Give You Up',
			byArtist: 'Rick Astley',
			inAlbum: 'Whenever You Need Somebody',
			isrcCode: 'USQX91300108',
			sameAs: ['https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'],
		});

		const data = result.resolved?.classifications[0]?.data as Record<string, unknown>;
		expect(data.sameAs).toEqual(['https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh']);
		expect(data.isrcCode).toBe('USQX91300108');
		expect(data.identifier).toBe('int:isrc:USQX91300108');
	});

	it('resolves Spotify podcast shows and episodes via domain API adapter in createServerEngine', async () => {
		const requestedUrls: string[] = [];
		const fetch = async (input: string) => {
			requestedUrls.push(input);

			if (input === 'https://accounts.spotify.com/api/token') {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						access_token: 'spotify-test-token',
					}),
				};
			}

			if (input.includes('/shows/38bS44xjbVVZ3No3ByF1dJ')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						id: '38bS44xjbVVZ3No3ByF1dJ',
						name: 'Spotify Engineering Culture',
						description: 'A show about building audio products.',
						publisher: 'Spotify',
						external_urls: {
							spotify: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
						},
					}),
				};
			}

			expect(input).toContain('/episodes/512ojhOuo1ktJprKbVcKyQ');
			return {
				ok: true,
				status: 200,
				json: async () => ({
					id: '512ojhOuo1ktJprKbVcKyQ',
					name: 'Classifying Podcasts',
					description: 'A focused episode.',
					release_date: '2026-05-01',
					duration_ms: 1_800_000,
					external_urls: {
						spotify: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
					},
					show: {
						id: '38bS44xjbVVZ3No3ByF1dJ',
						name: 'Spotify Engineering Culture',
						external_urls: {
							spotify: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
						},
					},
				}),
			};
		};

		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins({
				spotifyPluginOptions: {
					credentials: {
						spotify: {
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
						},
					},
					adapters: {
						domainApi: createSpotifyDomainApiAdapter({
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
							market: 'US',
							fetch: legacySpotifyFetch(fetch),
						}),
					},
				},
			}),
		});

		const showResult = await engine.classify({
			input: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
			mode: 'progressive',
			classificationSessionId: 'stage-spotify-show-domain-api',
		});
		const episodeResult = await engine.classify({
			input: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
			mode: 'progressive',
			classificationSessionId: 'stage-spotify-episode-domain-api',
		});

		expect(requestedUrls).toContain(
			'https://api.spotify.com/v1/shows/38bS44xjbVVZ3No3ByF1dJ?market=US'
		);
		expect(requestedUrls).toContain(
			'https://api.spotify.com/v1/episodes/512ojhOuo1ktJprKbVcKyQ?market=US'
		);
		expect(showResult.resolved?.atoms[0]?.schemaType).toBe('PodcastSeries');
		expect(showResult.resolved?.atoms[0]?.category).toBe('podcast');
		expect(showResult.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'PodcastSeries',
			name: 'Spotify Engineering Culture',
			publisher: 'Spotify',
			sameAs: ['https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ'],
		});
		expect(episodeResult.resolved?.atoms[0]?.schemaType).toBe('PodcastEpisode');
		expect(episodeResult.resolved?.atoms[0]?.category).toBe('podcast');
		expect(episodeResult.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'PodcastEpisode',
			name: 'Classifying Podcasts',
			datePublished: '2026-05-01',
			partOfSeries: {
				'@type': 'PodcastSeries',
				name: 'Spotify Engineering Culture',
			},
			sameAs: ['https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ'],
		});
	});

	it('resolves YouTube video title via oEmbed adapter in createServerEngine', async () => {
		const fetch = createPinAwareFetch(async (input: string) => {
			expect(input).toContain('https://www.youtube.com/oembed');
			expect(input).toContain('url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ');
			return Response.json({
				title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
				author_name: 'Rick Astley',
				thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
			});
		});

		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins({
				platformV0PluginOptions: {
					adapters: {
						oEmbed: createYouTubeOEmbedAdapter({
							fetch,
						}),
					},
				},
			}),
		});

		const result = await engine.classify({
			input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			mode: 'progressive',
			classificationSessionId: 'stage-youtube-oembed',
		});

		expect(result.classification?.domain).toBe('youtube');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:oembed');
		expect(result.resolved?.atoms[0]?.title).toBe(
			'Rick Astley - Never Gonna Give You Up (Official Video)'
		);
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'VideoObject',
			name: 'Rick Astley - Never Gonna Give You Up (Official Video)',
			contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			author: 'Rick Astley',
			thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
		});
	});
});

function slug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

const X_DOMAIN_API_POST_PAYLOAD = {
	data: [
		{
			id: '1920505170888216700',
			author_id: 'x-user-1',
			text: 'Introducing: $TRUST.',
			created_at: '2025-05-08T15:44:48.000Z',
		},
	],
	includes: {
		users: [
			{
				id: 'x-user-1',
				username: '0xIntuition',
				name: 'Intuition',
				profile_image_url: 'https://pbs.twimg.com/profile_images/example_normal.jpg',
			},
		],
		media: [
			{
				preview_image_url:
					'https://pbs.twimg.com/amplify_video_thumb/1920230250094419968/img/example.jpg',
			},
		],
	},
} as const;
