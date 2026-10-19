import { describe, expect, it } from 'vitest';

import * as primitives from '../index.js';
import type { IidAnchorOptions } from '../types.js';

// Literal reference candidate/validator fixtures, including typed-wd cases that
// the root harness excludes. No runtime oracle or harness imports.
interface CandidateCase {
	name: string;
	slug: string;
	values: Record<string, unknown>;
	candidateIid: string;
	expected:
		| { data: string; dataHex: string; id: string; iid: string; profile: string }
		| { error: string };
}
const candidates: CandidateCase[] = [
	{
		name: 'harvested: active typed wd candidate flips to P0',
		slug: 'movie',
		values: {
			sameAs: ['https://www.wikidata.org/wiki/Q25188'],
		},
		candidateIid: 'int:wd:film:Q25188',
		expected: {
			data: 'int:wd:film:Q25188',
			dataHex: '0x696e743a77643a66696c6d3a513235313838',
			id: '0x674b0eb5286a845f2f953f01d5ee72d0712d0fdfdc958dc5de6fe89269bd6dae',
			iid: 'int:wd:film:Q25188',
			profile: 'p0',
		},
	},
	{
		name: 'harvested: active typed wd candidate of another classification refused',
		slug: 'book',
		values: {
			isbn: '9780140328721',
			name: 'Matilda',
		},
		candidateIid: 'int:wd:film:Q42',
		expected: {
			error: 'Candidate wd identifier classifies as "Movie", not "Book": int:wd:film:Q42',
		},
	},
	{
		name: 'harvested: anchor-eligible candidate overrides values',
		slug: 'music-recording',
		values: {
			isrc: 'GBARL9300135',
			name: 'One Last Time',
		},
		candidateIid: 'int:isrc:USQX91300108',
		expected: {
			data: 'int:isrc:USQX91300108',
			dataHex: '0x696e743a697372633a555351583931333030313038',
			id: '0x42eea046949fed98884bad097ac5c7ec5a81b0b3ace46313f46abd9dcf6bd858',
			iid: 'int:isrc:USQX91300108',
			profile: 'p0',
		},
	},
	{
		name: 'harvested: dormant typed wd candidate refused for book',
		slug: 'book',
		values: {
			isbn: '9780140328721',
			name: 'Matilda',
		},
		candidateIid: 'int:wd:written-work:Q47461344',
		expected: {
			error:
				'Candidate wd identifier is parse-only and cannot be minted for "book": int:wd:written-work:Q47461344',
		},
	},
	{
		name: 'harvested: non-canonical registered-scheme candidate is rejected',
		slug: 'book',
		values: {
			isbn: '0-14-032872-6',
			name: 'Matilda',
		},
		candidateIid: 'int:isbn:0-14-032872-6',
		expected: {
			error: 'Candidate identifier is not canonical for "book": int:isbn:0-14-032872-6',
		},
	},
	{
		name: 'harvested: plain wd candidate promotable for music-album',
		slug: 'music-album',
		values: {
			name: 'Fixture music entity',
		},
		candidateIid: 'int:wd:Q189729',
		expected: {
			data: '{"@context":"https://schema.org/","@type":"MusicAlbum","identifier":"int:wd:Q189729","name":"Fixture music entity"}',
			dataHex:
				'0x7b2240636f6e74657874223a2268747470733a2f2f736368656d612e6f72672f222c224074797065223a224d75736963416c62756d222c226964656e746966696572223a22696e743a77643a51313839373239222c226e616d65223a2246697874757265206d7573696320656e74697479227d',
			id: '0x4c818586fef1459414261aa32f293b8a11b665148e2d639e8c6899124cb1c660',
			iid: 'int:wd:Q189729',
			profile: 'p1',
		},
	},
	{
		name: 'harvested: plain wd candidate promotable for music-group',
		slug: 'music-group',
		values: {
			name: 'Fixture music entity',
		},
		candidateIid: 'int:wd:Q189729',
		expected: {
			data: '{"@context":"https://schema.org/","@type":"MusicGroup","identifier":"int:wd:Q189729","name":"Fixture music entity"}',
			dataHex:
				'0x7b2240636f6e74657874223a2268747470733a2f2f736368656d612e6f72672f222c224074797065223a224d7573696347726f7570222c226964656e746966696572223a22696e743a77643a51313839373239222c226e616d65223a2246697874757265206d7573696320656e74697479227d',
			id: '0x674e942510a0d0f79f4795987ac5f3aada37db4e9bda869f8ed6eed2d0ecf744',
			iid: 'int:wd:Q189729',
			profile: 'p1',
		},
	},
	{
		name: 'harvested: plain wd candidate refused for book',
		slug: 'book',
		values: {
			isbn: '9780140328721',
			name: 'Matilda',
		},
		candidateIid: 'int:wd:Q42',
		expected: {
			error: 'Candidate wd identifier is parse-only and cannot be minted for "book": int:wd:Q42',
		},
	},
	{
		name: 'harvested: provider-local handle candidate rides the P1 values envelope',
		slug: 'music-recording',
		values: {
			name: "I'm Shady",
			sameAs: ['https://open.spotify.com/track/3UMaczJpikHgJFyBTAJVOz'],
		},
		candidateIid: 'int:spotify:track:3UMaczJpikHgJFyBTAJVOz',
		expected: {
			data: '{"@context":"https://schema.org/","@type":"MusicRecording","identifier":"int:spotify:track:3UMaczJpikHgJFyBTAJVOz","name":"I\'m Shady","sameAs":["https://open.spotify.com/track/3UMaczJpikHgJFyBTAJVOz"]}',
			dataHex:
				'0x7b2240636f6e74657874223a2268747470733a2f2f736368656d612e6f72672f222c224074797065223a224d757369635265636f7264696e67222c226964656e746966696572223a22696e743a73706f746966793a747261636b3a33554d61637a4a70696b48674a46794254414a564f7a222c226e616d65223a2249276d205368616479222c2273616d654173223a5b2268747470733a2f2f6f70656e2e73706f746966792e636f6d2f747261636b2f33554d61637a4a70696b48674a46794254414a564f7a225d7d',
			id: '0xcfc77bb8c419823519005546dae827a89ec16f222ea7f8564c19362614b19bab',
			iid: 'int:spotify:track:3UMaczJpikHgJFyBTAJVOz',
			profile: 'p1',
		},
	},
	{
		name: 'harvested: weak acct candidate rides the P1 values envelope',
		slug: 'social-media-account',
		values: {
			platform: 'x',
			url: 'https://x.com/jack',
			username: 'jack',
		},
		candidateIid: 'int:acct:x:@jack',
		expected: {
			data: '{"@context":"https://schema.org/","@type":"SocialMediaAccount","identifier":"int:acct:x:@jack","username":"jack","platform":"x","url":"https://x.com/jack"}',
			dataHex:
				'0x7b2240636f6e74657874223a2268747470733a2f2f736368656d612e6f72672f222c224074797065223a22536f6369616c4d656469614163636f756e74222c226964656e746966696572223a22696e743a616363743a783a406a61636b222c22757365726e616d65223a226a61636b222c22706c6174666f726d223a2278222c2275726c223a2268747470733a2f2f782e636f6d2f6a61636b227d',
			id: '0x83ac130749dcbcf8e315ea626363ef182d6a8f4d1f4b1d63d96cd9eeca8491bb',
			iid: 'int:acct:x:@jack',
			profile: 'p1',
		},
	},
	{
		name: 'synthetic: candidate P1 envelope missing required field throws plain Error',
		slug: 'web-page',
		values: {
			url: 'https://example.com/a',
		},
		candidateIid: 'int:url:https://example.com/a',
		expected: {
			error: 'Invalid values for classification "web-page": Missing required field "name".',
		},
	},
	{
		name: 'synthetic: candidate gen1 (Class C) rides the P1 fallback envelope',
		slug: 'music-group',
		values: {
			name: 'Daft Punk',
		},
		candidateIid: 'int:gen1:music-group:r4:364a1631a4fa913186c8b1db07729e6e',
		expected: {
			data: '{"@context":"https://schema.org/","@type":"MusicGroup","identifier":"int:gen1:music-group:r4:364a1631a4fa913186c8b1db07729e6e","name":"Daft Punk"}',
			dataHex:
				'0x7b2240636f6e74657874223a2268747470733a2f2f736368656d612e6f72672f222c224074797065223a224d7573696347726f7570222c226964656e746966696572223a22696e743a67656e313a6d757369632d67726f75703a72343a3336346131363331613466613931333138366338623164623037373239653665222c226e616d65223a22446166742050756e6b227d',
			id: '0x72590cd17ebc992d437d0f4ef011f13b7a023393bbbab11f428193ba298c65f7',
			iid: 'int:gen1:music-group:r4:364a1631a4fa913186c8b1db07729e6e',
			profile: 'p1',
		},
	},
	{
		name: 'synthetic: candidate not an IID shape rejected',
		slug: 'music-recording',
		values: {
			name: 'x',
		},
		candidateIid: 'not-an-iid',
		expected: {
			error: 'Candidate identifier is not canonical for "music-recording": not-an-iid',
		},
	},
	{
		name: 'synthetic: candidate plain wd refused for movie (not a music classification)',
		slug: 'movie',
		values: {
			name: 'Inception',
		},
		candidateIid: 'int:wd:Q25188',
		expected: {
			error:
				'Candidate wd identifier is parse-only and cannot be minted for "movie": int:wd:Q25188',
		},
	},
	{
		name: 'synthetic: candidate polymorphic url rides the fallback envelope after @type',
		slug: 'web-page',
		values: {
			name: 'A',
			url: 'https://example.com/a',
		},
		candidateIid: 'int:url:https://example.com/a',
		expected: {
			data: '{"@context":"https://schema.org/","@type":"WebPage","identifier":"int:url:https://example.com/a","name":"A","url":"https://example.com/a"}',
			dataHex:
				'0x7b2240636f6e74657874223a2268747470733a2f2f736368656d612e6f72672f222c224074797065223a2257656250616765222c226964656e746966696572223a22696e743a75726c3a68747470733a2f2f6578616d706c652e636f6d2f61222c226e616d65223a2241222c2275726c223a2268747470733a2f2f6578616d706c652e636f6d2f61227d',
			id: '0x54f569809abb215859969bba6810f47a86bccc555603f6f64523ec22c22f5464',
			iid: 'int:url:https://example.com/a',
			profile: 'p1',
		},
	},
	{
		name: 'synthetic: candidate registered scheme lowercase isrc rejected',
		slug: 'music-recording',
		values: {
			name: 'x',
		},
		candidateIid: 'int:isrc:us-qx9-13-00108',
		expected: {
			error:
				'Candidate identifier is not canonical for "music-recording": int:isrc:us-qx9-13-00108',
		},
	},
	{
		name: 'synthetic: candidate typed wd human P0 for person',
		slug: 'person',
		values: {
			givenName: 'Douglas',
		},
		candidateIid: 'int:wd:human:Q42',
		expected: {
			data: 'int:wd:human:Q42',
			dataHex: '0x696e743a77643a68756d616e3a513432',
			id: '0x2425c4bef18851d3bf6f3f9945dce08a5848399f6ef09366a780049eba788e88',
			iid: 'int:wd:human:Q42',
			profile: 'p0',
		},
	},
	{
		name: 'synthetic: candidate unregistered scheme with embedded whitespace rejected',
		slug: 'music-recording',
		values: {
			name: 'x',
		},
		candidateIid: 'int:spotify:track:abc def',
		expected: {
			error:
				'Candidate identifier is not canonical for "music-recording": int:spotify:track:abc def',
		},
	},
];

describe('reference candidate anchor parity', () => {
	for (const { name, slug, values, candidateIid, expected } of candidates)
		it(name, () => {
			const options: IidAnchorOptions = { candidateIid };
			const result = primitives.buildIidAnchor(slug, values, options);
			if ('error' in expected) {
				expect(result).toEqual({ success: false, errors: [expected.error] });
			} else {
				expect(result.success).toBe(true);
				if (result.success) expect(result.value).toMatchObject(expected);
			}
		});

	it('exports buildAtomAnchor as the same function object with the same options', () => {
		expect(primitives.buildAtomAnchor).toBe(primitives.buildIidAnchor);
		expect(
			primitives.buildAtomAnchor('music-recording', {}, { candidateIid: 'int:isrc:USQX91300108' })
		).toEqual(
			primitives.buildIidAnchor('music-recording', {}, { candidateIid: 'int:isrc:USQX91300108' })
		);
	});

	it('keeps the absent-candidate path byte-identical to the existing gen1 result', () => {
		const values = { familyName: 'Adams', givenName: 'Douglas' };
		expect(primitives.buildIidAnchor('person', values, { candidateIid: undefined })).toEqual(
			primitives.buildIidAnchor('person', values)
		);
	});

	it.each([
		['canonical over-cap URL', `int:url:https://example.com/${'a'.repeat(220)}`],
		['noncanonical over-cap URL', `int:url:https://EXAMPLE.com/${'a'.repeat(220)}`],
		['empty candidate', ''],
		['unregistered value over cap', `int:spotify:${'a'.repeat(221)}`],
		['unregistered scheme over 32 characters', `int:${'a'.repeat(33)}:value`],
		['unregistered newline', 'int:spotify:track:abc\n'],
		['unregistered Unicode whitespace', 'int:spotify:track:abc\u00a0def'],
	])('rejects %s without using the derived URL fallback', (_name, candidateIid) => {
		expect(
			primitives.buildIidAnchor('music-recording', { isrc: 'USQX91300108' }, { candidateIid })
		).toEqual({
			success: false,
			errors: [`Candidate identifier is not canonical for "music-recording": ${candidateIid}`],
		});
	});

	it('accepts canonical registered schemes independently of the classification ladder', () => {
		const result = primitives.buildIidAnchor('book', {}, { candidateIid: 'int:isrc:USQX91300108' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.value.data).toBe('int:isrc:USQX91300108');
	});
});

const validators = [
	{
		name: 'canonical isbn validates',
		slug: 'book',
		iid: 'int:isbn:9780684832722',
		overCap: false,
		valid: true,
		error: null,
	},
	{
		name: 'canonical over-cap url is the accepted exception (false, no throw)',
		slug: 'web-page',
		iid: 'int:url:https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		overCap: true,
		valid: false,
		error: null,
	},
	{
		name: 'canonical url exactly at cap validates',
		slug: 'web-page',
		iid: 'int:url:https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		overCap: false,
		valid: true,
		error: null,
	},
	{
		name: 'canonical url one over cap is the accepted exception',
		slug: 'web-page',
		iid: 'int:url:https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		overCap: true,
		valid: false,
		error: null,
	},
	{
		name: 'malformed over-cap url throws invalid IID',
		slug: 'web-page',
		iid: 'int:url:not-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-url',
		overCap: false,
		valid: null,
		error:
			'Derived identifier is not canonical for "web-page": int:url:not-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-urlnot-a-url',
	},
	{
		name: 'non-canonical isbn throws',
		slug: 'book',
		iid: 'int:isbn:978-0-684-83272-2',
		overCap: false,
		valid: null,
		error: 'Derived identifier is not canonical for "book": int:isbn:978-0-684-83272-2',
	},
	{
		name: 'non-canonical over-cap url (uppercase host) throws',
		slug: 'web-page',
		iid: 'int:url:https://EXAMPLE.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		overCap: false,
		valid: null,
		error:
			'Derived identifier is not canonical for "web-page": int:url:https://EXAMPLE.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
	},
	{
		name: 'oversized purl throws (not a url)',
		slug: 'software',
		iid: 'int:purl:npm/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		overCap: false,
		valid: null,
		error:
			'Derived identifier is not canonical for "software": int:purl:npm/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
	},
	{
		name: 'unregistered scheme throws',
		slug: 'music-recording',
		iid: 'int:spotify:track:3UMaczJpikHgJFyBTAJVOz',
		overCap: false,
		valid: null,
		error:
			'Derived identifier is not canonical for "music-recording": int:spotify:track:3UMaczJpikHgJFyBTAJVOz',
	},
];

describe('reference public anchor validators', () => {
	for (const { name, slug, iid, overCap, valid, error } of validators)
		it(name, () => {
			expect(primitives.isOverCapUrlIid(iid)).toBe(overCap);
			if (error) {
				expect(() => primitives.validateDerivedAnchorIid(slug, iid)).toThrowError(error);
				try {
					primitives.validateDerivedAnchorIid(slug, iid);
				} catch (caught) {
					expect(caught).toMatchObject({
						name: 'AtomAnchorError',
						code: 'INVALID_IID',
						message: error,
					});
				}
			} else {
				expect(primitives.validateDerivedAnchorIid(slug, iid)).toBe(valid);
			}
		});
});
