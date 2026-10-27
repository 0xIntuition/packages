import { expect, test } from 'bun:test';
import { createEnrichmentEngine } from '../src/engine';
import { resolveIdentifierHints } from '../src/identifier';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';
import { createMusicBrainzPlugin } from '../src/plugins/providers/musicbrainz';
import { createMockRequest } from '../src/testing';

const mbid = '5b11f4ce-a62d-471e-81fc-a69a8278c7da';

for (const type of ['artist', 'release-group', 'release', 'unknown']) {
	test(`a Wikidata primary with a ${type} MBID alias is not applicable and never fetches`, async () => {
		const urls: string[] = [];
		const plugin = createMusicBrainzPlugin({
			fetch: createPinAwareFetch(async (url) => {
				urls.push(String(url));
				return new Response(JSON.stringify({ id: mbid, title: 'Fixture recording' }));
			}),
		});
		const identifiers =
			type === 'unknown'
				? { mbid, mbidType: type }
				: resolveIdentifierHints({ identifier: { iid: `int:mbid:${type}:${mbid}` } });
		expect(identifiers).toMatchObject({ mbid, mbidType: type });
		const request = createMockRequest({
			input: {
				atomType: 'thing',
				identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
				source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
				hints: { identifiers },
			},
		});
		const result = await createEnrichmentEngine({ plugins: [plugin] }).enrich(request);
		expect(urls).toEqual([]);
		expect(result.skipped).toEqual([{ pluginId: 'musicbrainz', reason: 'not_applicable' }]);
		expect(result.artifacts).toEqual([]);
	});
}

for (const mbidType of ['recording', undefined]) {
	test(`a ${mbidType ?? 'untyped'} MBID keeps the recording endpoint and artifact`, async () => {
		const urls: string[] = [];
		const plugin = createMusicBrainzPlugin({
			fetch: createPinAwareFetch(async (url) => {
				urls.push(String(url));
				return new Response(JSON.stringify({ id: mbid, title: 'Fixture recording' }));
			}),
		});
		const request = createMockRequest({
			input: {
				atomType: 'thing',
				identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
				source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
				hints: { identifiers: { mbid, ...(mbidType ? { mbidType } : {}) } },
			},
		});
		const result = await createEnrichmentEngine({ plugins: [plugin] }).enrich(request);
		expect(urls).toEqual([`https://musicbrainz.org/ws/2/recording/${mbid}?fmt=json`]);
		expect(result.skipped).toEqual([]);
		expect(result.artifacts).toMatchObject([
			{
				artifact_type: 'musicbrainz',
				data: { mbid, name: 'Fixture recording', type: 'Recording' },
			},
		]);
	});
}
