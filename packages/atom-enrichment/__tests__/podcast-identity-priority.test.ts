import { expect, test } from 'bun:test';
import { derivePodcastGuid } from '@0xintuition/iid';
import { materializeProcessDataResolved } from '../src/materialize-node-data-resolved';

const feedUrl = 'https://feeds.npr.org/510318/podcast.xml';
const declared = '9b024349-ccf0-5f69-a609-6b82873eab3c';
for (const source of ['podcast-index', 'apple-music', 'wikidata']) {
	for (const hasDeclared of [true, false]) {
		test(`${source} known feed selects ${hasDeclared ? 'declared' : 'derived'} GUID before its handle`, () => {
			const data = materializeProcessDataResolved({
				classification: {
					resolved: {
						atoms: [
							{
								schemaType: 'PodcastSeries',
								canonicalId: 'podcast-index:123',
								data: { '@type': 'PodcastSeries', identifier: 'int:podcast-index:123' },
							},
						],
					},
				},
				enrichment: {
					artifacts: [
						{
							artifact_type: source,
							data: { feedUrl, ...(hasDeclared ? { podcastGuid: declared } : {}) },
						},
					],
				},
			});
			expect(data?.identifier).toBe(
				`int:podcastguid:${hasDeclared ? declared : derivePodcastGuid(feedUrl)}`
			);
			expect(data?.identifierRung).toContainEqual({ rung: 'podcast-index', value: '123' });
		});
	}
}
test('publisher declaration overrides the derived GUID from classification', () => {
	const data = materializeProcessDataResolved({
		classification: {
			resolved: {
				atoms: [
					{
						schemaType: 'PodcastSeries',
						canonicalId: `int:podcastguid:${derivePodcastGuid(feedUrl)}`,
						data: {
							'@type': 'PodcastSeries',
							identifier: `int:podcastguid:${derivePodcastGuid(feedUrl)}`,
							feedUrl,
						},
					},
				],
			},
		},
		enrichment: {
			artifacts: [{ artifact_type: 'podcast-index', data: { feedUrl, podcastGuid: declared } }],
		},
	});
	expect(data?.identifier).toBe(`int:podcastguid:${declared}`);
});

test('Podcast Index declaration outranks a Spotify show bridge-derived identifier set', async () => {
	const { createWikidataIdentityBridge } = await import(
		'../../atom-classification/src/identity-bridge'
	);
	const { normalizeClassificationIdentifiers } = await import(
		'../../atom-classification/src/collect-atom-identifiers'
	);
	const { unspacedRequestSlot } = await import('../../atom-classification/src/testing');
	const { musicFetch, musicResult } = await import(
		'../../atom-classification/__tests__/fixtures/music-identity'
	);
	const classification = normalizeClassificationIdentifiers(
		await createWikidataIdentityBridge({
			fetch: musicFetch('show'),
			requestSlot: unspacedRequestSlot(),
		})(musicResult('show'))
	);
	const data = materializeProcessDataResolved({
		classification,
		enrichment: {
			artifacts: [{ artifact_type: 'podcast-index', data: { feedUrl, podcastGuid: declared } }],
		},
	});
	expect(data?.identifier).toBe(`int:podcastguid:${declared}`);
});

for (const [schemaType, field, rung, subtype] of [
	['MusicAlbum', 'musicBrainzReleaseGroupId', 'mbid:release-group', 'release-group'],
	['MusicGroup', 'musicBrainzArtistId', 'mbid:artist', 'artist'],
] as const) {
	test(`Wikidata ${field} evidence projects the exact ${rung} level`, async () => {
		const { projectIdentifierRungs } = await import('../src/identifier-rung-projection');
		const id = '5ae54dee-4dba-49c0-802a-a3b3b3adfe9b';
		expect(
			projectIdentifierRungs({ schemaType, data: {}, evidence: [{ [field]: id }] })
		).toContainEqual({ rung, value: `${subtype}:${id}` });
	});
}
