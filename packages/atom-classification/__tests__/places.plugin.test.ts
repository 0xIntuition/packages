import { describe, expect, it } from 'bun:test';

import { createClassificationEngine } from '../src/engine';
import {
	createDefaultUrlPlugin,
	createPlacesOpenGraphAdapter,
	createPlacesPlugin,
	createV0TypeProfilesPlugin,
} from '../src/index';
import { resolvePublicTestHostname } from './helpers/public-dns';

// default-url now optionally fetches OpenGraph metadata (ENG-13195); pass
// deterministic DNS and transport seams so tests that reach its fallback
// never touch live DNS or the network.
const NO_NETWORK_FETCH = async () => ({ ok: false, status: 404, text: async () => '' });
const NO_NETWORK_OPTIONS = {
	fetch: NO_NETWORK_FETCH,
	resolveHostname: resolvePublicTestHostname,
};

// ENG-13710b: the core engine had no Google Maps/place plugin at all —
// `plugins/shared/platform.ts` PLATFORM_DOMAINS lacked maps, so any Maps URL
// fell through to the default-url catch-all and classified as a generic
// Website/Thing (never LocalBusiness/place), regardless of what the user
// explicitly picked in the FE type-picker.
describe('places plugin', () => {
	it.each([
		['https://maps.app.goo.gl/AbC123xyz', undefined],
		['https://maps.google.com/maps/place/Joe%27s+Pizza/@40.73,-73.99,17z', "Joe's Pizza"],
		['https://maps.google.com/?cid=123456789', 'Google Maps Place'],
		['https://maps.google.com/?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4', 'Google Maps Place'],
		[
			'https://www.google.com/maps/place/Blue+Bottle+Coffee/@37.77,-122.41,17z/data=xyz',
			'Blue Bottle Coffee',
		],
	])('classifies %s as LocalBusiness/place', async (url, expectedName) => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createPlacesPlugin({ useDefaultOpenGraphAdapter: false }),
				createDefaultUrlPlugin(NO_NETWORK_OPTIONS),
			],
		});

		const result = await engine.classify({
			input: url,
			mode: 'progressive',
			classificationSessionId: `places-${url}`,
		});

		expect(result.classification?.domain).toBe('places');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('LocalBusiness');
		expect(result.resolved?.atoms[0]?.category).toBe('place');
		if (expectedName) {
			expect(result.resolved?.atoms[0]?.title).toBe(expectedName);
		}
	});

	it('does not match unrelated google.com paths', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createPlacesPlugin({ useDefaultOpenGraphAdapter: false }),
				createDefaultUrlPlugin(NO_NETWORK_OPTIONS),
			],
		});

		const result = await engine.classify({
			input: 'https://www.google.com/search?q=pizza',
			mode: 'progressive',
			classificationSessionId: 'places-unrelated',
		});

		expect(result.classification?.domain).toBe('web');
	});

	it('does not split a Unicode surrogate pair at the title boundary', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createPlacesPlugin({ useDefaultOpenGraphAdapter: false }),
			],
		});
		const emoji = '😀';
		const truncatedResult = await engine.classify({
			input: `https://maps.google.com/maps/place/${'a'.repeat(511)}${encodeURIComponent(emoji)}`,
			mode: 'progressive',
			classificationSessionId: 'places-unicode-truncated',
		});
		const intactResult = await engine.classify({
			input: `https://maps.google.com/maps/place/${'a'.repeat(510)}${encodeURIComponent(emoji)}`,
			mode: 'progressive',
			classificationSessionId: 'places-unicode-intact',
		});

		expect(truncatedResult.resolved?.atoms[0]?.title).toBe('a'.repeat(511));
		expect(intactResult.resolved?.atoms[0]?.title).toBe(`${'a'.repeat(510)}${emoji}`);
	});

	it('bounds URL-derived canonical identities for long Google Maps links', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createPlacesPlugin({ useDefaultOpenGraphAdapter: false }),
			],
		});
		const result = await engine.classify({
			input: `https://www.google.com/maps/place/Eiffel+Tower/data=${'x'.repeat(650)}`,
			mode: 'progressive',
			classificationSessionId: 'places-long-url',
		});

		expect(result.resolved?.atoms[0]?.canonicalId).toMatch(/^places:/);
		expect(result.resolved?.atoms[0]?.canonicalId?.length).toBeLessThanOrEqual(512);
	});

	it('keeps URL-derived place identity and title stable when OpenGraph succeeds', async () => {
		const url = 'https://maps.app.goo.gl/AbC123xyz';
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createPlacesPlugin({
					useDefaultOpenGraphAdapter: false,
					adapters: {
						openGraph: createPlacesOpenGraphAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(PLACE_OPEN_GRAPH_HTML),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: url,
			mode: 'progressive',
			classificationSessionId: 'places-opengraph',
		});

		expect(result.resolved?.atoms[0]?.category).toBe('place');
		expect(result.resolved?.atoms[0]).toMatchObject({
			title: 'Google Maps Place',
			description: '4.5 stars · 1,200 reviews',
			data: {
				name: 'Google Maps Place',
				alternateName: "Joe's Pizza · Italian Restaurant",
			},
		});

		const fallbackEngine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createPlacesPlugin({ useDefaultOpenGraphAdapter: false }),
			],
		});
		const fallbackResult = await fallbackEngine.classify({
			input: url,
			mode: 'progressive',
			classificationSessionId: 'places-without-opengraph',
		});

		expect(result.resolved?.atoms[0]?.canonicalId).toBe(
			fallbackResult.resolved?.atoms[0]?.canonicalId
		);
		expect(result.resolved?.atoms[0]?.title).toBe(fallbackResult.resolved?.atoms[0]?.title);
		expect(result.resolved?.atoms[0]?.data.name).toBe(fallbackResult.resolved?.atoms[0]?.data.name);
	});
});

const PLACE_OPEN_GRAPH_HTML = `
<html>
	<head>
		<meta property="og:title" content="Joe's Pizza · Italian Restaurant" />
		<meta property="og:description" content="4.5 stars · 1,200 reviews" />
	</head>
</html>
`;
