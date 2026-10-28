import { describe, expect, it } from 'bun:test';

import { createClassificationEngine } from '../src/engine';
import {
	createDefaultUrlPlugin,
	createInstagramOpenGraphAdapter,
	createInstagramPlugin,
	createV0TypeProfilesPlugin,
} from '../src/index';
import { resolvePublicTestHostname } from './helpers/public-dns';

// default-url now optionally fetches OpenGraph metadata (ENG-13195); pass
// deterministic DNS and transport seams even though the instagram classifier
// is expected to win before default-url runs.
const NO_NETWORK_FETCH = async () => ({ ok: false, status: 404, text: async () => '' });
const NO_NETWORK_OPTIONS = {
	fetch: NO_NETWORK_FETCH,
	resolveHostname: resolvePublicTestHostname,
};

describe('instagram plugin', () => {
	// ENG-13567: manual "Person" classification rejected social profile URLs
	// when metadata wasn't fetched. Root cause (shared with ENG-13569): the
	// instagram classifier required an absolute URL, so a schemeless profile
	// link fell through to the generic default-url plugin instead of the
	// deterministic identity-only Person fallback.
	it('classifies a schemeless instagram profile URL as Person, not the generic fallback', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createInstagramPlugin({ useDefaultOpenGraphAdapter: false }),
				createDefaultUrlPlugin(NO_NETWORK_OPTIONS),
			],
		});

		const result = await engine.classify({
			input: 'instagram.com/0xintuition',
			mode: 'progressive',
			classificationSessionId: 'instagram-schemeless-profile',
		});

		expect(result.classification?.domain).toBe('instagram');
		expect(result.classification?.subtype).toBe('profile');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
		expect(result.resolved?.atoms[0]?.category).toBe('person');
	});

	it('resolves Person deterministically with no metadata fetch at all (no adapters configured)', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createInstagramPlugin({ useDefaultOpenGraphAdapter: false }),
			],
		});

		const result = await engine.classify({
			input: 'https://www.instagram.com/0xintuition',
			mode: 'progressive',
			classificationSessionId: 'instagram-no-metadata',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.fallbackUsed).toBe(true);
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
		expect(result.resolved?.atoms[0]?.category).toBe('person');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'instagram',
			provider: 'instagram',
			fallbackStage: 'generic',
		});
	});

	it('enriches profile identity from OpenGraph when a fetcher is wired', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createInstagramPlugin({
					useDefaultOpenGraphAdapter: false,
					adapters: {
						openGraph: createInstagramOpenGraphAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(INSTAGRAM_PROFILE_OPEN_GRAPH_HTML),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://www.instagram.com/0xintuition',
			mode: 'progressive',
			classificationSessionId: 'instagram-opengraph',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.category).toBe('person');
		expect(result.resolved?.atoms[0]?.title).toBe('0xIntuition (@0xintuition) • Instagram photos');
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({
			pluginId: 'instagram',
			provider: 'instagram-opengraph',
			fallbackStage: 'opengraph',
		});
	});

	it('never returns Thing for a profile URL even when every adapter fails', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createInstagramPlugin({
					adapters: {
						openGraph: createInstagramOpenGraphAdapter({
							fetch: async () => {
								throw new Error('network unavailable');
							},
							resolveHostname: resolvePublicTestHostname,
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://www.instagram.com/0xintuition',
			mode: 'progressive',
			classificationSessionId: 'instagram-fetch-failure',
		});

		expect(result.resolved?.atoms[0]?.category).toBe('person');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('SocialMediaAccount');
	});
});

const INSTAGRAM_PROFILE_OPEN_GRAPH_HTML = `
<html>
	<head>
		<meta property="og:title" content="0xIntuition (@0xintuition) • Instagram photos" />
		<meta property="og:description" content="Building the world's largest knowledge graph." />
		<meta property="og:image" content="https://instagram.com/example-avatar.jpg" />
		<title>0xIntuition (@0xintuition) • Instagram photos</title>
	</head>
</html>
`;
