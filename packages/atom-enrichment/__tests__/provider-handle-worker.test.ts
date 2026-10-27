import { describe, expect, it } from 'bun:test';
import { createEnrichmentEngine } from '../src/engine';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';
import { getRequestUrl } from '../src/plugins/providers/__shared__/request';
import wikidata from '../src/plugins/providers/wikidata/__fixtures__/entity.json';
import organizationWikidata from '../src/plugins/providers/wikidata/__fixtures__/organization-entity.json';
import wikipedia from '../src/plugins/providers/wikipedia/__fixtures__/summary.json';
import { type ServerDefaultPresetOptions, serverDefaultPreset } from '../src/presets';

const id = '4Z8W4fKeB5YxbusRsdQVPb';
const spotifyUrl = `https://open.spotify.com/artist/${id}`;
const wikiUrl = 'https://en.wikipedia.org/wiki/Acme_Labs';
const artist = {
	'@type': 'MusicGroup',
	identifier: `int:spotify:artist:${id}`,
	name: 'Acme Labs',
	sameAs: [wikiUrl, spotifyUrl],
};

async function run(jsonLd: Record<string, unknown>) {
	const calls: string[] = [];
	const fetcher = async (input: string | URL | Request) => {
		const url = String(input);
		calls.push(url);
		if (url.includes('/api/rest_v1/page/summary/')) return Response.json(wikipedia);
		if (url.includes('action=wbsearchentities'))
			return Response.json({ search: [{ id: 'Q12345' }] });
		// Title-derived artist lookups must carry a P31 mapped to the allowed family.
		if (url.includes('Special:EntityData/'))
			return Response.json(jsonLd['@type'] === 'MusicGroup' ? organizationWikidata : wikidata);
		if (url.startsWith('https://open.spotify.com/oembed'))
			return Response.json({
				title: 'Acme Labs',
				thumbnail_url: 'https://i.scdn.co/image/fixture',
				html: '<iframe></iframe>',
				provider_name: 'Spotify',
				type: 'rich',
				version: '1.0',
			});
		return new Response('', { status: 404 });
	};
	const options: ServerDefaultPresetOptions = Object.fromEntries(
		[
			'appleMusic',
			'brand',
			'coingecko',
			'crossref',
			'etherscan',
			'favicon',
			'github',
			'letterboxd',
			'microdata',
			'musicbrainz',
			'oembed',
			'opengraph',
			'openlibrary',
			'places',
			'podcastIndex',
			'productListing',
			'spotify',
			'steam',
			'tmdb',
			'xProfile',
			'wikidata',
			'wikipedia',
			'youtube',
		].map((key) => [key, { fetch: createPinAwareFetch(fetcher) }])
	);
	const request = {
		input: {
			atomType: 'thing' as const,
			jsonLd,
			source: { classificationEngine: 'worker-fixture', classifiedAt: '2026-09-23T00:00:00.000Z' },
		},
		runtime: 'server' as const,
	};
	const engine = createEnrichmentEngine({
		plugins: serverDefaultPreset(options),
		secrets: {},
		now: () => '2026-09-23T00:00:00.000Z',
	});
	const result = await engine.enrich(request);
	return { result, calls, target: getRequestUrl(request) };
}

describe('provider handle worker engine path', () => {
	it('produces Spotify beside Wikipedia and Wikidata with Wikipedia remaining the target', async () => {
		const { result, calls, target } = await run(artist);
		expect(target).toBe(wikiUrl);
		expect(result.artifacts.map((a) => a.artifact_type)).toEqual(
			expect.arrayContaining(['spotify', 'wikipedia', 'wikidata'])
		);
		expect(result.artifacts.filter((a) => a.artifact_type === 'spotify')).toHaveLength(1);
		expect(
			calls.some(
				(url) =>
					url.startsWith('https://open.spotify.com/oembed') &&
					decodeURIComponent(url).includes(spotifyUrl)
			)
		).toBe(true);
	});
	it('preserves the Spotify-only path', async () => {
		const withHandle = await run({ ...artist, sameAs: [spotifyUrl] });
		const withoutHandle = await run({ ...artist, identifier: undefined, sameAs: [spotifyUrl] });
		expect(withHandle.result.artifacts.filter((a) => a.artifact_type === 'spotify')).toHaveLength(
			1
		);
		expect(withHandle.result.artifacts).toEqual(withoutHandle.result.artifacts);
		expect([...withHandle.calls].sort()).toEqual([...withoutHandle.calls].sort());
	});
	it('preserves registered Movie artifacts and provider calls', async () => {
		const movie = { '@type': 'Movie', name: 'Acme Labs', sameAs: [wikiUrl] };
		const withIid = await run({ ...movie, identifier: 'int:tmdb:movie:550' });
		const withoutIid = await run(movie);
		expect(withIid.result.artifacts).toEqual(withoutIid.result.artifacts);
		expect([...withIid.calls].sort()).toEqual([...withoutIid.calls].sort());
		expect(withIid.result.artifacts.some((a) => a.artifact_type === 'spotify')).toBe(false);
	});

	it('issues no provider request for a handle the ladder rejects', async () => {
		const thing = { '@type': 'Thing', name: 'Acme Labs', sameAs: [wikiUrl] };
		const overlong = await run({ ...thing, identifier: `int:coingecko:${'a'.repeat(221)}` });
		const control = await run(thing);
		expect(overlong.calls.some((url) => url.includes('coingecko'))).toBe(false);
		expect(overlong.calls).toEqual(control.calls);
	});
});
