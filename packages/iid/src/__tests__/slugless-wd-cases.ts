// Offline reference outputs; ladders snapshot the six published declarative shapes.
import type { DerivedIid, IdentityLadder, IidValueMap } from '../types.js';
export const sluglessWdLadders: IdentityLadder[] = [
	{
		slug: 'brand',
		identifies: 'a brand/concept (instance businesses are local-business atoms)',
		rungs: [
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'gen1', tag: 2, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
	{
		slug: 'event',
		identifies: 'an event occurrence',
		rungs: [
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'same-as' } },
			{
				kind: 'gen1',
				tag: 3,
				recipe: [
					{ key: 'name', from: 'field' },
					{ key: 'startDate', from: 'field' },
				],
			},
			{ kind: 'gen1', tag: 4, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
	{
		slug: 'local-business',
		identifies: 'one business at one place (instance level)',
		rungs: [
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{
				kind: 'gen1',
				tag: 2,
				recipe: [
					{ key: 'name', from: 'field' },
					{ key: 'geo7', from: 'geohash', precision: 7 },
				],
			},
			{ kind: 'gen1', tag: 4, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
	{
		slug: 'location',
		identifies: 'a named place or coordinate point',
		rungs: [
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'geo', source: { kind: 'geohash', precision: 8 } },
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
	{
		slug: 'music-group',
		identifies: 'an artist/band public identity',
		rungs: [
			{ kind: 'scheme', scheme: 'isni', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'mbid', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'gen1', tag: 4, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
	{
		slug: 'thing',
		identifies: 'anything not covered by a specific classification (weakest IDs by design)',
		rungs: [
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'same-as' } },
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
];
export const sluglessWdCases: {
	name: string;
	slug: string;
	values: IidValueMap;
	expected: DerivedIid | null;
}[] = [
	{
		name: 'brand: skips slugless wd for bare QID URL in sameAs',
		slug: 'brand',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/wiki/Q42'] },
		expected: {
			iid: 'int:gen1:brand:r2:111db647afed8684146bd46eac081882',
			scheme: 'gen1',
			class: 'C',
			tag: 2,
		},
	},
	{
		name: 'brand: skips slugless wd for bare QID string',
		slug: 'brand',
		values: { name: 'Acme', sameAs: ['Q42'] },
		expected: {
			iid: 'int:gen1:brand:r2:111db647afed8684146bd46eac081882',
			scheme: 'gen1',
			class: 'C',
			tag: 2,
		},
	},
	{
		name: 'brand: skips slugless wd for lowercase entity path',
		slug: 'brand',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/entity/q42'] },
		expected: {
			iid: 'int:gen1:brand:r2:111db647afed8684146bd46eac081882',
			scheme: 'gen1',
			class: 'C',
			tag: 2,
		},
	},
	{
		name: 'brand: skips slugless wd for two values forward',
		slug: 'brand',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42'] },
		expected: {
			iid: 'int:gen1:brand:r2:111db647afed8684146bd46eac081882',
			scheme: 'gen1',
			class: 'C',
			tag: 2,
		},
	},
	{
		name: 'brand: skips slugless wd for two values reversed',
		slug: 'brand',
		values: { name: 'Acme', sameAs: ['Q42', 'Q9'] },
		expected: {
			iid: 'int:gen1:brand:r2:111db647afed8684146bd46eac081882',
			scheme: 'gen1',
			class: 'C',
			tag: 2,
		},
	},
	{
		name: 'brand: skips slugless wd for set minimum',
		slug: 'brand',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42', 'Q100'] },
		expected: {
			iid: 'int:gen1:brand:r2:111db647afed8684146bd46eac081882',
			scheme: 'gen1',
			class: 'C',
			tag: 2,
		},
	},
	{
		name: 'brand: skips slugless wd for no fallback data',
		slug: 'brand',
		values: { sameAs: ['Q42'] },
		expected: null,
	},
	{
		name: 'event: skips slugless wd for bare QID URL in sameAs',
		slug: 'event',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/wiki/Q42'] },
		expected: { iid: 'int:url:https://wikidata.org/wiki/Q42', scheme: 'url', class: 'B' },
	},
	{
		name: 'event: skips slugless wd for bare QID string',
		slug: 'event',
		values: { name: 'Acme', sameAs: ['Q42'] },
		expected: {
			iid: 'int:gen1:event:r4:54e4dcf723d7f1d10afc04188b70f7f2',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'event: skips slugless wd for lowercase entity path',
		slug: 'event',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/entity/q42'] },
		expected: { iid: 'int:url:https://wikidata.org/entity/q42', scheme: 'url', class: 'B' },
	},
	{
		name: 'event: skips slugless wd for two values forward',
		slug: 'event',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42'] },
		expected: {
			iid: 'int:gen1:event:r4:54e4dcf723d7f1d10afc04188b70f7f2',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'event: skips slugless wd for two values reversed',
		slug: 'event',
		values: { name: 'Acme', sameAs: ['Q42', 'Q9'] },
		expected: {
			iid: 'int:gen1:event:r4:54e4dcf723d7f1d10afc04188b70f7f2',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'event: skips slugless wd for set minimum',
		slug: 'event',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42', 'Q100'] },
		expected: {
			iid: 'int:gen1:event:r4:54e4dcf723d7f1d10afc04188b70f7f2',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'event: skips slugless wd for no fallback data',
		slug: 'event',
		values: { sameAs: ['Q42'] },
		expected: null,
	},
	{
		name: 'local-business: skips slugless wd for bare QID URL in sameAs',
		slug: 'local-business',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/wiki/Q42'] },
		expected: {
			iid: 'int:gen1:local-business:r4:cdd01ae99ef9b6f889baaf1780b6fe1f',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'local-business: skips slugless wd for bare QID string',
		slug: 'local-business',
		values: { name: 'Acme', sameAs: ['Q42'] },
		expected: {
			iid: 'int:gen1:local-business:r4:cdd01ae99ef9b6f889baaf1780b6fe1f',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'local-business: skips slugless wd for lowercase entity path',
		slug: 'local-business',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/entity/q42'] },
		expected: {
			iid: 'int:gen1:local-business:r4:cdd01ae99ef9b6f889baaf1780b6fe1f',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'local-business: skips slugless wd for two values forward',
		slug: 'local-business',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42'] },
		expected: {
			iid: 'int:gen1:local-business:r4:cdd01ae99ef9b6f889baaf1780b6fe1f',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'local-business: skips slugless wd for two values reversed',
		slug: 'local-business',
		values: { name: 'Acme', sameAs: ['Q42', 'Q9'] },
		expected: {
			iid: 'int:gen1:local-business:r4:cdd01ae99ef9b6f889baaf1780b6fe1f',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'local-business: skips slugless wd for set minimum',
		slug: 'local-business',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42', 'Q100'] },
		expected: {
			iid: 'int:gen1:local-business:r4:cdd01ae99ef9b6f889baaf1780b6fe1f',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'local-business: skips slugless wd for no fallback data',
		slug: 'local-business',
		values: { sameAs: ['Q42'] },
		expected: null,
	},
	{
		name: 'location: skips slugless wd for bare QID URL in sameAs',
		slug: 'location',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/wiki/Q42'] },
		expected: {
			iid: 'int:gen1:location:r3:a6c2b1456f9b460f61ba0fb2e117b458',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'location: skips slugless wd for bare QID string',
		slug: 'location',
		values: { name: 'Acme', sameAs: ['Q42'] },
		expected: {
			iid: 'int:gen1:location:r3:a6c2b1456f9b460f61ba0fb2e117b458',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'location: skips slugless wd for lowercase entity path',
		slug: 'location',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/entity/q42'] },
		expected: {
			iid: 'int:gen1:location:r3:a6c2b1456f9b460f61ba0fb2e117b458',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'location: skips slugless wd for two values forward',
		slug: 'location',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42'] },
		expected: {
			iid: 'int:gen1:location:r3:a6c2b1456f9b460f61ba0fb2e117b458',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'location: skips slugless wd for two values reversed',
		slug: 'location',
		values: { name: 'Acme', sameAs: ['Q42', 'Q9'] },
		expected: {
			iid: 'int:gen1:location:r3:a6c2b1456f9b460f61ba0fb2e117b458',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'location: skips slugless wd for set minimum',
		slug: 'location',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42', 'Q100'] },
		expected: {
			iid: 'int:gen1:location:r3:a6c2b1456f9b460f61ba0fb2e117b458',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'location: skips slugless wd for no fallback data',
		slug: 'location',
		values: { sameAs: ['Q42'] },
		expected: null,
	},
	{
		name: 'music-group: skips slugless wd for bare QID URL in sameAs',
		slug: 'music-group',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/wiki/Q42'] },
		expected: {
			iid: 'int:gen1:music-group:r4:2072539de58b2326d00eb2f06a5aa372',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'music-group: skips slugless wd for bare QID string',
		slug: 'music-group',
		values: { name: 'Acme', sameAs: ['Q42'] },
		expected: {
			iid: 'int:gen1:music-group:r4:2072539de58b2326d00eb2f06a5aa372',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'music-group: skips slugless wd for lowercase entity path',
		slug: 'music-group',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/entity/q42'] },
		expected: {
			iid: 'int:gen1:music-group:r4:2072539de58b2326d00eb2f06a5aa372',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'music-group: skips slugless wd for two values forward',
		slug: 'music-group',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42'] },
		expected: {
			iid: 'int:gen1:music-group:r4:2072539de58b2326d00eb2f06a5aa372',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'music-group: skips slugless wd for two values reversed',
		slug: 'music-group',
		values: { name: 'Acme', sameAs: ['Q42', 'Q9'] },
		expected: {
			iid: 'int:gen1:music-group:r4:2072539de58b2326d00eb2f06a5aa372',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'music-group: skips slugless wd for set minimum',
		slug: 'music-group',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42', 'Q100'] },
		expected: {
			iid: 'int:gen1:music-group:r4:2072539de58b2326d00eb2f06a5aa372',
			scheme: 'gen1',
			class: 'C',
			tag: 4,
		},
	},
	{
		name: 'music-group: skips slugless wd for no fallback data',
		slug: 'music-group',
		values: { sameAs: ['Q42'] },
		expected: null,
	},
	{
		name: 'thing: skips slugless wd for bare QID URL in sameAs',
		slug: 'thing',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/wiki/Q42'] },
		expected: { iid: 'int:url:https://wikidata.org/wiki/Q42', scheme: 'url', class: 'B' },
	},
	{
		name: 'thing: skips slugless wd for bare QID string',
		slug: 'thing',
		values: { name: 'Acme', sameAs: ['Q42'] },
		expected: {
			iid: 'int:gen1:thing:r3:59502135c3a94e19bd4ddf964ea06ce5',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'thing: skips slugless wd for lowercase entity path',
		slug: 'thing',
		values: { name: 'Acme', sameAs: ['https://www.wikidata.org/entity/q42'] },
		expected: { iid: 'int:url:https://wikidata.org/entity/q42', scheme: 'url', class: 'B' },
	},
	{
		name: 'thing: skips slugless wd for two values forward',
		slug: 'thing',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42'] },
		expected: {
			iid: 'int:gen1:thing:r3:59502135c3a94e19bd4ddf964ea06ce5',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'thing: skips slugless wd for two values reversed',
		slug: 'thing',
		values: { name: 'Acme', sameAs: ['Q42', 'Q9'] },
		expected: {
			iid: 'int:gen1:thing:r3:59502135c3a94e19bd4ddf964ea06ce5',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'thing: skips slugless wd for set minimum',
		slug: 'thing',
		values: { name: 'Acme', sameAs: ['Q9', 'Q42', 'Q100'] },
		expected: {
			iid: 'int:gen1:thing:r3:59502135c3a94e19bd4ddf964ea06ce5',
			scheme: 'gen1',
			class: 'C',
			tag: 3,
		},
	},
	{
		name: 'thing: skips slugless wd for no fallback data',
		slug: 'thing',
		values: { sameAs: ['Q42'] },
		expected: null,
	},
];
