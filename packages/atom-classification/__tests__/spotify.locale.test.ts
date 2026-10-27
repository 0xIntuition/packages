import { describe, expect, it } from 'bun:test';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createClassificationEngine } from '../src/engine';
import {
	createDefaultUrlPlugin,
	createSpotifyDomainApiAdapter,
	createSpotifyPlugin,
	createV0TypeProfilesPlugin,
} from '../src/plugins/index';
import { legacySpotifyFetch } from './helpers/legacy-spotify-fetch';

import { resolvePublicTestHostname } from './helpers/public-dns';

// The shared provider hop resolves every target before it dials; no network is used.
useStubbedPublicDns();

const NO_NETWORK_OPTIONS = {
	fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
	resolveHostname: resolvePublicTestHostname,
};

const RESOURCE_ID = '4iV5W9uYEdYUVa79Axb7Rh';

describe('Spotify localized URLs (ENG-16769)', () => {
	for (const resourceType of ['track', 'album', 'artist', 'playlist', 'show', 'episode']) {
		it(`resolves localized ${resourceType} links to the ordinary URL identity`, async () => {
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				runtime: 'server',
				plugins: [
					createV0TypeProfilesPlugin(),
					createSpotifyPlugin(),
					createDefaultUrlPlugin(NO_NETWORK_OPTIONS),
				],
			});
			const canonicalUrl = `https://open.spotify.com/${resourceType}/${RESOURCE_ID}`;
			const ordinary = await engine.classify({ input: canonicalUrl, mode: 'progressive' });
			for (const locale of ['en', 'de', 'pt-BR']) {
				const localized = await engine.classify({
					input: `https://open.spotify.com/intl-${locale}/${resourceType}/${RESOURCE_ID}?si=share`,
					mode: 'progressive',
				});
				expect(localized.classification).toMatchObject({
					domain: 'spotify',
					subtype: resourceType,
					meta: { resourceId: RESOURCE_ID, canonicalUrl },
				});
				expect(localized.resolved?.atoms[0]).toMatchObject({
					canonicalId: ordinary.resolved?.atoms[0]?.canonicalId,
					schemaType: ordinary.resolved?.atoms[0]?.schemaType,
					sameAs: [canonicalUrl],
				});
			}
		});
	}

	it('fetches track metadata for the resource after the locale prefix', async () => {
		const requestedUrls: string[] = [];
		const canonicalUrl = `https://open.spotify.com/track/${RESOURCE_ID}`;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: {
						spotify: { clientId: 'test-client', clientSecret: 'test-secret' },
					},
					adapters: {
						domainApi: createSpotifyDomainApiAdapter({
							market: 'US',
							fetch: legacySpotifyFetch(async (url) => {
								requestedUrls.push(url);
								return {
									ok: true,
									status: 200,
									json: async () =>
										url === 'https://accounts.spotify.com/api/token'
											? { access_token: 'test-token' }
											: {
													id: RESOURCE_ID,
													name: 'Resolved track',
													external_urls: { spotify: canonicalUrl },
												},
								};
							}),
						}),
					},
				}),
				createDefaultUrlPlugin(NO_NETWORK_OPTIONS),
			],
		});
		const result = await engine.classify({
			input: `https://open.spotify.com/intl-en/track/${RESOURCE_ID}?si=share`,
			mode: 'progressive',
		});
		expect(requestedUrls).toEqual([
			'https://accounts.spotify.com/api/token',
			`https://api.spotify.com/v1/tracks/${RESOURCE_ID}?market=US`,
		]);
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'MusicRecording',
			title: 'Resolved track',
			sameAs: [canonicalUrl],
		});
	});
});
