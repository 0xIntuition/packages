import { describe, expect, it } from 'vitest';

import { buildIidAnchor } from '../anchor.js';

// Literal reference-vector bytes and salted IDs; no runtime oracle dependency.
const cases: readonly {
	name: string;
	slug: string;
	values: Record<string, unknown>;
	data: string;
	id: string;
	iid: string | null;
	profile: string;
}[] = [
	{
		name: 'harvested: P1 envelope when no rung fires',
		slug: 'review',
		values: {
			reviewBody: 'Excellent.',
		},
		data: '{"@context":"https://schema.org/","@type":"Review","reviewBody":"Excellent."}',
		id: '0x0dfffdff202f6bc0decedeed96d401e56e7c312322e0182528f5641ebf732cb8',
		iid: null,
		profile: 'p1',
	},
	{
		name: 'harvested: identifier-shaped name excluded from search text',
		slug: 'movie',
		values: {
			name: 'int:wd:Q25188',
			sameAs: ['https://evidence.example/inception'],
		},
		data: '{"@context":"https://schema.org/","@type":"Movie","identifier":"int:gen1:movie:r5:706db04bdf3676623e287ae9781adafc","name":"int:wd:Q25188","sameAs":["https://evidence.example/inception"]}',
		id: '0xcdd25a76e75da2f49b835d3ed753e3d5aad3efbb17e0038657978196fd937b2c',
		iid: 'int:gen1:movie:r5:706db04bdf3676623e287ae9781adafc',
		profile: 'p1',
	},
	{
		name: 'harvested: isrc P0 bare bytes',
		slug: 'music-recording',
		values: {
			isrc: 'US-QX9-13-00108',
		},
		data: 'int:isrc:USQX91300108',
		id: '0x42eea046949fed98884bad097ac5c7ec5a81b0b3ace46313f46abd9dcf6bd858',
		iid: 'int:isrc:USQX91300108',
		profile: 'p0',
	},
	{
		name: 'harvested: local-business gen1 r2 (name + geo7) with sameAs z,a',
		slug: 'local-business',
		values: {
			name: 'Blue Bottle Coffee',
			latitude: 37.7823,
			longitude: -122.4076,
			sameAs: ['https://evidence.example/z', 'https://evidence.example/a'],
		},
		data: '{"@context":"https://schema.org/","@type":"LocalBusiness","identifier":"int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09","name":"Blue Bottle Coffee","geo7":"9q8yyw1","sameAs":["https://evidence.example/a","https://evidence.example/z"]}',
		id: '0x6a14178238cfa147d1ec9d06272a163dbd146a58095224529e1d95db75d5fe51',
		iid: 'int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09',
		profile: 'p1',
	},
	{
		name: 'harvested: local-business gen1 r2 with reordered keys and sameAs a,z',
		slug: 'local-business',
		values: {
			sameAs: ['https://evidence.example/a', 'https://evidence.example/z'],
			longitude: -122.4076,
			latitude: 37.7823,
			name: 'Blue Bottle Coffee',
		},
		data: '{"@context":"https://schema.org/","@type":"LocalBusiness","identifier":"int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09","name":"Blue Bottle Coffee","geo7":"9q8yyw1","sameAs":["https://evidence.example/a","https://evidence.example/z"]}',
		id: '0x6a14178238cfa147d1ec9d06272a163dbd146a58095224529e1d95db75d5fe51',
		iid: 'int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09',
		profile: 'p1',
	},
	{
		name: 'harvested: over-cap url falls back to P1 without identifier',
		slug: 'web-page',
		values: {
			name: 'Long URL',
			url: 'https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		},
		data: '{"@context":"https://schema.org/","@type":"WebPage","name":"Long URL","url":"https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
		id: '0x74f9fa07c7a980a45750951136372595e47419b2eac92d07b1c9df9aa88610ae',
		iid: null,
		profile: 'p1',
	},
	{
		name: 'harvested: podcast guid derived from upper-case feed host',
		slug: 'podcast-series',
		values: {
			feedUrl: 'https://FEEDS.EXAMPLE.ORG/podcast.xml',
			name: 'Podcast',
		},
		data: 'int:podcastguid:7d8bd745-04d4-5ab5-9754-49afad1729dc',
		id: '0x9cf6bb388a9cf540157aacb3a34660e72db4cb1c58bdea1b69b536c96ce15b4c',
		iid: 'int:podcastguid:7d8bd745-04d4-5ab5-9754-49afad1729dc',
		profile: 'p0',
	},
	{
		name: 'harvested: search text from display field',
		slug: 'movie',
		values: {
			name: 'Inception',
			sameAs: ['https://evidence.example/inception'],
		},
		data: '{"@context":"https://schema.org/","@type":"Movie","identifier":"int:gen1:movie:r5:ed2d2ab3773c903a3e8f9ebac3a13122","name":"Inception","sameAs":["https://evidence.example/inception"]}',
		id: '0x117527781a691838bd73f042309ee2d53d81e07a37ced19eb123230a1e32e6b2',
		iid: 'int:gen1:movie:r5:ed2d2ab3773c903a3e8f9ebac3a13122',
		profile: 'p1',
	},
	{
		name: 'harvested: wd evidence derives typed P0 without bare wd',
		slug: 'movie',
		values: {
			name: 'Inception',
			sameAs: ['https://www.wikidata.org/wiki/Q25188'],
		},
		data: 'int:wd:film:Q25188',
		id: '0x674b0eb5286a845f2f953f01d5ee72d0712d0fdfdc958dc5de6fe89269bd6dae',
		iid: 'int:wd:film:Q25188',
		profile: 'p0',
	},
	{
		name: 'synthetic: aggregate-rating (null ladder) fallback envelope',
		slug: 'aggregate-rating',
		values: {
			ratingValue: 4.5,
			reviewCount: 10,
		},
		data: '{"@context":"https://schema.org/","@type":"AggregateRating","ratingValue":4.5,"reviewCount":10}',
		id: '0x545be1e8362592f21b392597d135d06573a1d038eb5db603891c54c0f168d650',
		iid: null,
		profile: 'p1',
	},
	{
		name: 'synthetic: book gen1 r3 one identity field',
		slug: 'book',
		values: {
			name: 'The Sovereign Individual',
		},
		data: '{"@context":"https://schema.org/","@type":"Book","identifier":"int:gen1:book:r3:59a02a73cbe0d2a4223719fdc4d006ab","name":"The Sovereign Individual"}',
		id: '0x27fe44bef8cf7b4e45aecfa32f1cc9eb9b234c18fd85e176cb7ab07a352efe55',
		iid: 'int:gen1:book:r3:59a02a73cbe0d2a4223719fdc4d006ab',
		profile: 'p1',
	},
	{
		name: 'synthetic: book isbn P0 without required name (P0 path skips validation)',
		slug: 'book',
		values: {
			isbn: '9780684832722',
		},
		data: 'int:isbn:9780684832722',
		id: '0xc9f31c9c60164867df9c9b0aaca9e2504d3c11a3d2b75726382fb429171eb18b',
		iid: 'int:isbn:9780684832722',
		profile: 'p0',
	},
	{
		name: 'synthetic: book olid work P0',
		slug: 'book',
		values: {
			name: 'The Sovereign Individual',
			sameAs: ['https://openlibrary.org/works/OL2716871W'],
		},
		data: 'int:olid:OL2716871W',
		id: '0x0942a97872dae9f15081f3daff02619ef3a16081a99a4c435db5a4e692a4b97f',
		iid: 'int:olid:OL2716871W',
		profile: 'p0',
	},
	{
		name: 'synthetic: company url P1 with sameAs sorted and deduplicated',
		slug: 'company',
		values: {
			name: 'Example Co',
			url: 'https://www.example.com/',
			sameAs: ['https://b.example', 'https://a.example', 'https://b.example'],
		},
		data: '{"@context":"https://schema.org/","@type":"Organization","identifier":"int:url:https://example.com","sameAs":["https://a.example","https://b.example"]}',
		id: '0x3f7070045a24ed1e44b0c96e4356200f3230910d13e9a5c6d99871dadb1f862b',
		iid: 'int:url:https://example.com',
		profile: 'p1',
	},
	{
		name: 'synthetic: dataset doi from sameAs P1',
		slug: 'dataset',
		values: {
			name: 'Example Dataset',
			sameAs: ['https://doi.org/10.1000/182'],
		},
		data: '{"@context":"https://schema.org/","@type":"Dataset","identifier":"int:doi:10.1000/182","sameAs":["https://doi.org/10.1000/182"]}',
		id: '0xb994d18c8bda98c0d24efebe38d5e87d3ce56f3aba376955b851ec45f9560b90',
		iid: 'int:doi:10.1000/182',
		profile: 'p1',
	},
	{
		name: 'synthetic: defined-term termset P0',
		slug: 'defined-term',
		values: {
			name: 'follows',
			inDefinedTermSet: 'https://schema.intuition.systems/predicates',
			termCode: 'Follows',
		},
		data: 'int:termset:8a323938d39fadee18e74d6bb069e607:follows',
		id: '0x311148f9cb80a1b6f1d5abd6e1e58df209f4ef9938cb680c5f32cfdc593f403d',
		iid: 'int:termset:8a323938d39fadee18e74d6bb069e607:follows',
		profile: 'p0',
	},
	{
		name: 'synthetic: ethereum-account caip10 P1 with intuition schema context',
		slug: 'ethereum-account',
		values: {
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		},
		data: '{"@context":"https://schemas.intuition.systems/v1","@type":"EthereumAccount","identifier":"int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045"}',
		id: '0xca9e824639cd5af2f29c2c83ccb1ff9bbf6561cb317cdf3ab9a69d528599f5c2',
		iid: 'int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
		profile: 'p1',
	},
	{
		name: 'synthetic: ethereum-erc20 caip19 P0',
		slug: 'ethereum-erc20',
		values: {
			chainId: 1,
			address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			name: 'USD Coin',
			symbol: 'USDC',
			decimals: 6,
		},
		data: 'int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
		id: '0x7cf4030088ee4a2dd04f6c3062901be8458cf3fc3ee16e7c1a4f13644841af5e',
		iid: 'int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
		profile: 'p0',
	},
	{
		name: 'synthetic: ethereum-smart-contract caip10 P1',
		slug: 'ethereum-smart-contract',
		values: {
			chainId: 8453,
			address: '0x4200000000000000000000000000000000000006',
		},
		data: '{"@context":"https://schemas.intuition.systems/v1","@type":"EthereumSmartContract","identifier":"int:caip10:eip155:8453:0x4200000000000000000000000000000000000006"}',
		id: '0xd3775eace35b408370910b1214edf9dd33df419c14483d6240cb8d9b249d8295',
		iid: 'int:caip10:eip155:8453:0x4200000000000000000000000000000000000006',
		profile: 'p1',
	},
	{
		name: 'synthetic: event gen1 r3 name + startDate',
		slug: 'event',
		values: {
			name: 'Devcon 7',
			startDate: '2024-11-12',
		},
		data: '{"@context":"https://schema.org/","@type":"Event","identifier":"int:gen1:event:r3:9f2a79d7dc886cdad3ef25de0811502e","name":"Devcon 7","startDate":"2024-11-12"}',
		id: '0x8abddef052e13fa731db4988f2861209f61e91b428dbae319ad3034d344f1403',
		iid: 'int:gen1:event:r3:9f2a79d7dc886cdad3ef25de0811502e',
		profile: 'p1',
	},
	{
		name: 'synthetic: image content hash P1',
		slug: 'image',
		values: {
			name: 'Cover Art',
			url: 'https://cdn.example.com/cover.jpg',
			contentHash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
		},
		data: '{"@context":"https://schema.org/","@type":"ImageObject","identifier":"int:hash:sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"}',
		id: '0xcc2aa7d31c8df9171038f39dc9c059c8f6cc814bc3e25262d9032da6586d7920',
		iid: 'int:hash:sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
		profile: 'p1',
	},
	{
		name: 'synthetic: local-business gen1 r2 name + geo7 without sameAs (recipe order differs from sorted)',
		slug: 'local-business',
		values: {
			name: 'Blue Bottle Coffee',
			latitude: 37.7823,
			longitude: -122.4076,
		},
		data: '{"@context":"https://schema.org/","@type":"LocalBusiness","identifier":"int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09","name":"Blue Bottle Coffee","geo7":"9q8yyw1"}',
		id: '0x0e8f184ed14aa78250c54911ea4f00901d76d7c364a25b31cf3d2a7b27323bf0',
		iid: 'int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09',
		profile: 'p1',
	},
	{
		name: 'synthetic: location geo P1',
		slug: 'location',
		values: {
			name: 'Golden Gate Park',
			latitude: 37.7694,
			longitude: -122.4862,
		},
		data: '{"@context":"https://schema.org/","@type":"Place","identifier":"int:geo:9q8yug8q"}',
		id: '0x9ac23c45731adc98cee851a046c0bb70108f87a676f598dee53ab3f033949335',
		iid: 'int:geo:9q8yug8q',
		profile: 'p1',
	},
	{
		name: 'synthetic: mobile-application appid P0',
		slug: 'mobile-application',
		values: {
			name: 'Spotify',
			operatingSystem: 'iOS',
			bundleId: 'com.Spotify.Client',
		},
		data: 'int:appid:ios:com.spotify.client',
		id: '0xcbfabb94f3a698ff3af69d0f365de89d69eb2d9e616c9b6e09b699b8e2c36a60',
		iid: 'int:appid:ios:com.spotify.client',
		profile: 'p0',
	},
	{
		name: 'synthetic: mobile-application gen1 r3 name + operatingSystem',
		slug: 'mobile-application',
		values: {
			name: 'Example App',
			operatingSystem: 'iOS',
		},
		data: '{"@context":"https://schema.org/","@type":"MobileApplication","identifier":"int:gen1:mobile-application:r3:219e922c9d5a173b5b2e34d787c31043","name":"Example App","operatingSystem":"iOS"}',
		id: '0x882b13f9c0cac2f3eee721984a3dd12bf0b2b928cbe041bdec7031a59db86b23',
		iid: 'int:gen1:mobile-application:r3:219e922c9d5a173b5b2e34d787c31043',
		profile: 'p1',
	},
	{
		name: 'synthetic: movie gen1 r4 name + yearPublished (derived from datePublished)',
		slug: 'movie',
		values: {
			name: 'Inception',
			datePublished: '2010-07-16',
		},
		data: '{"@context":"https://schema.org/","@type":"Movie","identifier":"int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a","name":"Inception","yearPublished":"2010"}',
		id: '0x1c684570d60c85a1e89f910cf7543a700bad760e60da6491ec437e3c08528cf1',
		iid: 'int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a',
		profile: 'p1',
	},
	{
		name: 'synthetic: movie gen1 r5 name only',
		slug: 'movie',
		values: {
			name: 'Inception',
		},
		data: '{"@context":"https://schema.org/","@type":"Movie","identifier":"int:gen1:movie:r5:ed2d2ab3773c903a3e8f9ebac3a13122","name":"Inception"}',
		id: '0x2d1c2c78860df50bcfae7987df360254c189afafa60e367f3113b8cac46923bf',
		iid: 'int:gen1:movie:r5:ed2d2ab3773c903a3e8f9ebac3a13122',
		profile: 'p1',
	},
	{
		name: 'synthetic: music-album mbid release-group P0',
		slug: 'music-album',
		values: {
			name: 'Discovery',
			sameAs: ['https://musicbrainz.org/release-group/41b3f6ea-f7b6-3a6c-9a0a-3f8d6e2a1b55'],
		},
		data: 'int:mbid:release-group:41b3f6ea-f7b6-3a6c-9a0a-3f8d6e2a1b55',
		id: '0x9043f6ac724c79623536cda976fb243a440e9784ce3346dd23c0d94c886d44d9',
		iid: 'int:mbid:release-group:41b3f6ea-f7b6-3a6c-9a0a-3f8d6e2a1b55',
		profile: 'p0',
	},
	{
		name: 'synthetic: music-group gen1 r4 one identity field',
		slug: 'music-group',
		values: {
			name: 'Daft Punk',
		},
		data: '{"@context":"https://schema.org/","@type":"MusicGroup","identifier":"int:gen1:music-group:r4:364a1631a4fa913186c8b1db07729e6e","name":"Daft Punk"}',
		id: '0x72590cd17ebc992d437d0f4ef011f13b7a023393bbbab11f428193ba298c65f7',
		iid: 'int:gen1:music-group:r4:364a1631a4fa913186c8b1db07729e6e',
		profile: 'p1',
	},
	{
		name: 'synthetic: music-group gen1 with pre-NORM-1 padding and punctuation kept verbatim in envelope',
		slug: 'music-group',
		values: {
			name: '  Don’t  Stop  ',
		},
		data: '{"@context":"https://schema.org/","@type":"MusicGroup","identifier":"int:gen1:music-group:r4:16247e59edd4e1de1c0351b1cec58010","name":"  Don’t  Stop  "}',
		id: '0xab6013c5f5c7e0c789e41dbaaf352ce4bf2b28439218b0c52a67c5650d202a80',
		iid: 'int:gen1:music-group:r4:16247e59edd4e1de1c0351b1cec58010',
		profile: 'p1',
	},
	{
		name: 'synthetic: music-recording mbid recording P0',
		slug: 'music-recording',
		values: {
			name: 'One More Time',
			sameAs: ['https://musicbrainz.org/recording/b1a9c0e9-d987-4042-ae91-78d6a3267d69'],
		},
		data: 'int:mbid:recording:b1a9c0e9-d987-4042-ae91-78d6a3267d69',
		id: '0x695856ef8a14d99881df54c05da0129158185007e5bc41322c4bc3a5b20bb94b',
		iid: 'int:mbid:recording:b1a9c0e9-d987-4042-ae91-78d6a3267d69',
		profile: 'p0',
	},
	{
		name: 'synthetic: music-recording search text uses display fields only',
		slug: 'music-recording',
		values: {
			name: 'Hello',
			byArtist: 'Adele',
			inAlbum: '25',
		},
		data: '{"@context":"https://schema.org/","@type":"MusicRecording","identifier":"int:gen1:music-recording:r3:a337905d810c1ef0ebd635c498c5602e","name":"Hello"}',
		id: '0x819b1237354029c67555d65ee9b50003d6980ac0e8481f8d8dba1a0dc36b8d11',
		iid: 'int:gen1:music-recording:r3:a337905d810c1ef0ebd635c498c5602e',
		profile: 'p1',
	},
	{
		name: 'synthetic: person gen1 r5 mononym',
		slug: 'person',
		values: {
			givenName: 'Rihanna',
		},
		data: '{"@context":"https://schema.org/","@type":"Person","identifier":"int:gen1:person:r5:9a529760b515df0ecc49efacfa9edd02","givenName":"Rihanna"}',
		id: '0x9b6e575aa613eb657c01c3c26559a2b393877f451046a346d1b66e330c76a6d6',
		iid: 'int:gen1:person:r5:9a529760b515df0ecc49efacfa9edd02',
		profile: 'p1',
	},
	{
		name: 'synthetic: person isni P1 identity envelope with sameAs',
		slug: 'person',
		values: {
			givenName: 'Douglas',
			familyName: 'Adams',
			sameAs: ['https://isni.org/isni/0000000121032683'],
		},
		data: '{"@context":"https://schema.org/","@type":"Person","identifier":"int:isni:0000000121032683","sameAs":["https://isni.org/isni/0000000121032683"]}',
		id: '0xb763b2a00d5dad1b6c3ccd18cdb5009d7e4954c8eec50974999151be6da250fa',
		iid: 'int:isni:0000000121032683',
		profile: 'p1',
	},
	{
		name: 'synthetic: person typed wd human P0',
		slug: 'person',
		values: {
			givenName: 'Douglas',
			sameAs: ['https://www.wikidata.org/wiki/Q42'],
		},
		data: 'int:wd:human:Q42',
		id: '0x2425c4bef18851d3bf6f3f9945dce08a5848399f6ef09366a780049eba788e88',
		iid: 'int:wd:human:Q42',
		profile: 'p0',
	},
	{
		name: 'synthetic: podcast-episode rssitem P0',
		slug: 'podcast-episode',
		values: {
			name: 'Episode 42: Determinism',
			feedGuid: 'f77016bc-fd74-5c94-893f-864deb06fc30',
			itemGuid: 'urn:example:ep42-2026-02-02',
		},
		data: 'int:rssitem:f77016bc-fd74-5c94-893f-864deb06fc30:24c1d49d31be0033a0dad44b31121f60',
		id: '0x50f431a7754d019a60019ec67f5d95c741cf9c4207c8e3afae2d9c1c3629e7ca',
		iid: 'int:rssitem:f77016bc-fd74-5c94-893f-864deb06fc30:24c1d49d31be0033a0dad44b31121f60',
		profile: 'p0',
	},
	{
		name: 'synthetic: podcast-series declared podcastGuid P0',
		slug: 'podcast-series',
		values: {
			name: 'The Example Show',
			podcastGuid: '917393E3-1B1E-5CEF-ACE4-EDAA54E1F810',
		},
		data: 'int:podcastguid:917393e3-1b1e-5cef-ace4-edaa54e1f810',
		id: '0xbd566e2e2f15c5f06f357c708de27b540e8c15309a3a9c7f7eba0f73c47a37b1',
		iid: 'int:podcastguid:917393e3-1b1e-5cef-ace4-edaa54e1f810',
		profile: 'p0',
	},
	{
		name: 'synthetic: product gtin P0 zero-padded to 14',
		slug: 'product',
		values: {
			name: 'Cheerios',
			gtin: '036000291452',
		},
		data: 'int:gtin:00036000291452',
		id: '0x07aa16b43bb251731dcb2baf8beadb4ca3272d53cfb75a95e368d46c500a87aa',
		iid: 'int:gtin:00036000291452',
		profile: 'p0',
	},
	{
		name: 'synthetic: review fallback envelope with sameAs deduplicated and sorted',
		slug: 'review',
		values: {
			reviewBody: 'Great.',
			sameAs: ['not a url', 'also not', 'not a url'],
		},
		data: '{"@context":"https://schema.org/","@type":"Review","reviewBody":"Great.","sameAs":["also not","not a url"]}',
		id: '0xd10d1647ee9813fd3038c360193bcf4310b7f5ec9ca6493d913b48682bbb9616',
		iid: null,
		profile: 'p1',
	},
	{
		name: 'synthetic: social-media-account strong acct P0',
		slug: 'social-media-account',
		values: {
			username: 'jack',
			platform: 'x',
			platformUserId: '44196397',
		},
		data: 'int:acct:x:44196397',
		id: '0xd6bd22027909c747e22ecff252c5fa18c6f2c36dc9b261b6dcd70aa59e43e6da',
		iid: 'int:acct:x:44196397',
		profile: 'p0',
	},
	{
		name: 'synthetic: social-media-account weak acct derived P1 identity envelope',
		slug: 'social-media-account',
		values: {
			username: 'Jack',
			platform: 'X',
		},
		data: '{"@context":"https://schema.org/","@type":"SocialMediaAccount","identifier":"int:acct:x:@jack"}',
		id: '0x6f6e6cddc00b86681497bc1f8c8e5d8b7c4adcb449845ea781569f141c0f6e93',
		iid: 'int:acct:x:@jack',
		profile: 'p1',
	},
	{
		name: 'synthetic: social-media-posting gen1 r2 hashed text field',
		slug: 'social-media-posting',
		values: {
			name: 'A post',
			text: 'Hello, world!',
		},
		data: '{"@context":"https://schema.org/","@type":"SocialMediaPosting","identifier":"int:gen1:social-media-posting:r2:ccf9aa81c0ef8873521aa1d2b7e15848","textHash":"fbc3a5b569f80319726d3cc77c708b0d"}',
		id: '0xcca088bf2391d4749b11aa872ebcd37f3975a8be0afd4bb1e9dd3d0a5851408d',
		iid: 'int:gen1:social-media-posting:r2:ccf9aa81c0ef8873521aa1d2b7e15848',
		profile: 'p1',
	},
	{
		name: 'synthetic: software purl P0',
		slug: 'software',
		values: {
			name: 'React',
			codeRepository: 'https://github.com/facebook/react',
			packageUrl: 'pkg:npm/react@18.2.0',
		},
		data: 'int:purl:npm/react',
		id: '0x5b20923c46fc106e99dfae6a7448cfd149bce732bde80c8614cfdced0348d9ca',
		iid: 'int:purl:npm/react',
		profile: 'p0',
	},
	{
		name: 'synthetic: software-application url P1',
		slug: 'software-application',
		values: {
			name: 'Example App',
			url: 'https://www.example.com/app/?utm_source=x&b=2&a=1#frag',
		},
		data: '{"@context":"https://schema.org/","@type":"SoftwareApplication","identifier":"int:url:https://example.com/app?a=1&b=2"}',
		id: '0xb2822d47fa5cfd9ff4548ae4a42c3813e6cc2e913c9f330f35225d30bdd4b14d',
		iid: 'int:url:https://example.com/app?a=1&b=2',
		profile: 'p1',
	},
	{
		name: 'synthetic: thing gen1 r3 one identity field with description in search text',
		slug: 'thing',
		values: {
			name: 'Widget',
			description: 'A small thing',
		},
		data: '{"@context":"https://schema.org/","@type":"Thing","identifier":"int:gen1:thing:r3:83b315e77a5a5e19e249a7e386852d9b","name":"Widget"}',
		id: '0x9eafb37eef9326b684ab17ccd3d6c33a0caa613278a97eba41fa92447953f4af',
		iid: 'int:gen1:thing:r3:83b315e77a5a5e19e249a7e386852d9b',
		profile: 'p1',
	},
	{
		name: 'synthetic: tv-series gen1 r4 name + startYear (derived from startDate)',
		slug: 'tv-series',
		values: {
			name: 'Game of Thrones',
			startDate: '2011-04-17',
		},
		data: '{"@context":"https://schema.org/","@type":"TVSeries","identifier":"int:gen1:tv-series:r4:3cf57bf78e0ac33c0e4a17b002228a7e","name":"Game of Thrones","startYear":"2011"}',
		id: '0xdd1ebcb128bd96bbe03be028fb0be0807945d983052d73c41d4e341e777e4010',
		iid: 'int:gen1:tv-series:r4:3cf57bf78e0ac33c0e4a17b002228a7e',
		profile: 'p1',
	},
	{
		name: 'synthetic: tv-series typed wd television-series P0',
		slug: 'tv-series',
		values: {
			name: 'Game of Thrones',
			startDate: '2011-04-17',
			sameAs: ['https://www.wikidata.org/wiki/Q1079'],
		},
		data: 'int:wd:television-series:Q1079',
		id: '0x8d1ee5a4f133f5f1445c04b89d18ee6fe78b324cbf4b87a7e7f84abea8313f28',
		iid: 'int:wd:television-series:Q1079',
		profile: 'p0',
	},
	{
		name: 'synthetic: video-object contentUrl url P1',
		slug: 'video-object',
		values: {
			name: 'Launch Trailer',
			contentUrl: 'https://cdn.example.com/video.mp4',
		},
		data: '{"@context":"https://schema.org/","@type":"VideoObject","identifier":"int:url:https://cdn.example.com/video.mp4"}',
		id: '0x315745224185601facb4c0ec5346fa670b234e1915ccd17e2c15a48f58107890',
		iid: 'int:url:https://cdn.example.com/video.mp4',
		profile: 'p1',
	},
	{
		name: 'synthetic: web-page url canonicalized (fold, strip, sort, drop tracking)',
		slug: 'web-page',
		values: {
			name: 'Canon',
			url: 'http://www.Example.com:80/path/?utm_source=x&b=2&a=1#frag',
		},
		data: '{"@context":"https://schema.org/","@type":"WebPage","identifier":"int:url:https://example.com/path?a=1&b=2"}',
		id: '0xd8c9bdd2ba68089d35c9548816487be82ddb32316e871baf8b5d10c9288a8221',
		iid: 'int:url:https://example.com/path?a=1&b=2',
		profile: 'p1',
	},
	{
		name: 'synthetic: web-page url exactly at the 220-character value cap',
		slug: 'web-page',
		values: {
			name: 'At Cap',
			url: 'https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		},
		data: '{"@context":"https://schema.org/","@type":"WebPage","identifier":"int:url:https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
		id: '0xb416eeb566bbddf740e7af679710c1b894f31439f39ea2ec349d31bd8d46ab8a',
		iid: 'int:url:https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		profile: 'p1',
	},
	{
		name: 'synthetic: web-page url one over the 220-character value cap',
		slug: 'web-page',
		values: {
			name: 'Over Cap',
			url: 'https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		},
		data: '{"@context":"https://schema.org/","@type":"WebPage","name":"Over Cap","url":"https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
		id: '0x6f4550169a2ef0617d8eb8f4540cb020020ea7b3f59ee8626ee2a0417e89009d',
		iid: null,
		profile: 'p1',
	},
	{
		name: 'synthetic: web-site origin url P1',
		slug: 'web-site',
		values: {
			name: 'Example',
			url: 'https://www.example.com/deep/path?x=1',
		},
		data: '{"@context":"https://schema.org/","@type":"WebSite","identifier":"int:url:https://example.com"}',
		id: '0xa71e8f34fc5199a0b7fcfdb3d006d955a12cf27d389bdc642008da44209d15d4',
		iid: 'int:url:https://example.com',
		profile: 'p1',
	},
];

describe('reference envelope bytes', () => {
	it.each(cases)('$name', ({ slug, values, data, id, iid, profile }) => {
		const result = buildIidAnchor(slug, values);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.value.data).toBe(data);
		expect(result.value.dataHex).toBe(`0x${Buffer.from(data).toString('hex')}`);
		expect(result.value.id).toBe(id);
		expect(result.value.iid).toBe(iid);
		expect(result.value.profile).toBe(profile);
	});
});
