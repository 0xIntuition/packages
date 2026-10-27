import { expect, test } from 'bun:test';
import { schemaTypesAgree, wikidataTypeAgreement } from './wikidata-type';

for (const family of [
	['TVSeries', 'TVSeason', 'TVEpisode'],
	['MusicAlbum', 'MusicRecording'],
	['Person', 'Organization', 'MusicGroup'],
]) {
	test(`type family ${family[0]} agrees in both directions`, () => {
		for (const left of family)
			for (const right of family) expect(schemaTypesAgree(left, right)).toBe(true);
	});
}
test('cross-family, unknown and multi-type requests are handled conservatively', () => {
	expect(schemaTypesAgree('MusicAlbum', 'Movie')).toBe(false);
	expect(schemaTypesAgree(undefined, 'Movie')).toBe(false);
	expect(schemaTypesAgree(['CreativeWork', 'Movie'], 'Movie')).toBe(true);
	expect(wikidataTypeAgreement({}, 'Thing')).toBe('unknown');
});
test('deprecated P31 cannot authorize a title identity', () => {
	const claims = {
		P31: [{ rank: 'deprecated', mainsnak: { datavalue: { value: { id: 'Q11424' } } } }],
	};
	expect(wikidataTypeAgreement(claims, 'Movie')).toBe('unknown');
});
