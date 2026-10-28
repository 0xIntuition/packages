import { describe, expect, it } from 'bun:test';
import { parseAtom } from '../src/parse.ts';

const opts = { remoteFetch: false, ipfsGatewayBaseUrl: 'https://ipfs.io/' };
const localOnly = { remoteFetch: false };

describe('local detection: IPFS', () => {
	it('detects ipfs:// URI with CIDv1', async () => {
		const result = await parseAtom(
			'ipfs://bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e',
			opts
		);
		expect(result.kind).toBe('ipfs');
	});

	it('detects /ipfs/ path with CIDv1', async () => {
		const result = await parseAtom(
			'/ipfs/bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e/metadata.json',
			opts
		);
		expect(result.kind).toBe('ipfs');
	});

	it('IPFS precedes URL detection', async () => {
		const result = await parseAtom(
			'ipfs://bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e',
			opts
		);
		expect(result.kind).toBe('ipfs');
	});

	it('normalizes IPFS URI with path and constructs gateway URL', async () => {
		const result = await parseAtom(
			'ipfs://bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e/metadata/item.json',
			opts
		);
		expect(result.kind).toBe('ipfs');
		if (result.kind === 'ipfs') {
			expect(result.path).toBe('metadata/item.json');
			expect(result.gatewayUrl).toBe(
				'https://ipfs.io/ipfs/bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e/metadata/item.json'
			);
		}
	});

	it('detects CIDv0 (QmHash)', async () => {
		const result = await parseAtom('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', opts);
		expect(result.kind).toBe('ipfs');
	});

	it('malformed IPFS URI falls back to plain string', async () => {
		const result = await parseAtom('/ipfs/not-a-cid/metadata.json', localOnly);
		expect(result.kind).toBe('plain_string');
	});

	it('IPFS without gateway has no gatewayUrl', async () => {
		const result = await parseAtom(
			'ipfs://bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e',
			localOnly
		);
		expect(result.kind).toBe('ipfs');
		if (result.kind === 'ipfs') {
			expect(result.gatewayUrl).toBeUndefined();
		}
	});
});

describe('local detection: Ethereum address', () => {
	it('detects valid checksummed Ethereum address', async () => {
		const result = await parseAtom('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', localOnly);
		expect(result.kind).toBe('ethereum_address');
	});

	it('detects valid lowercase Ethereum address', async () => {
		const result = await parseAtom('0xd8da6bf26964af9d7eed9e03e53415d37aa96045', localOnly);
		expect(result.kind).toBe('ethereum_address');
	});

	it('rejects invalid Ethereum address (wrong length)', async () => {
		const result = await parseAtom('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA960', localOnly);
		expect(result.kind).toBe('plain_string');
	});

	it('rejects invalid hex characters', async () => {
		const result = await parseAtom('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', localOnly);
		expect(result.kind).toBe('plain_string');
	});

	it('returns checksummed address in normalized data', async () => {
		const result = await parseAtom('0xd8da6bf26964af9d7eed9e03e53415d37aa96045', localOnly);
		expect(result.kind).toBe('ethereum_address');
		if (result.kind === 'ethereum_address') {
			expect(result.checksumAddress).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
		}
	});
});

describe('local detection: ENS name', () => {
	it('detects simple .eth name', async () => {
		const result = await parseAtom('vitalik.eth', localOnly);
		expect(result.kind).toBe('ens_name');
	});

	it('detects subdomain .eth name', async () => {
		const result = await parseAtom('sub.vitalik.eth', localOnly);
		expect(result.kind).toBe('ens_name');
	});

	it('normalizes ENS name to lowercase', async () => {
		const result = await parseAtom('Vitalik.ETH', localOnly);
		expect(result.kind).toBe('ens_name');
		if (result.kind === 'ens_name') {
			expect(result.name).toBe('vitalik.eth');
		}
	});

	it('rejects bare .eth (empty label)', async () => {
		const result = await parseAtom('.eth', localOnly);
		expect(result.kind).not.toBe('ens_name');
	});

	it('rejects ENS name with invalid characters', async () => {
		const result = await parseAtom('hello world.eth', localOnly);
		expect(result.kind).not.toBe('ens_name');
	});

	it('rejects ENS name starting with hyphen', async () => {
		const result = await parseAtom('-invalid.eth', localOnly);
		expect(result.kind).not.toBe('ens_name');
	});
});

describe('local detection: JSON', () => {
	it('detects JSON object and extracts structured document URLs', async () => {
		const result = await parseAtom(
			'{"title":"Fixture","url":"https://example.com","sameAs":["https://example.com/alt"]}',
			localOnly
		);
		expect(result.kind).toBe('json');
		if (result.kind === 'json') {
			expect(result.topLevelType).toBe('object');
			expect(result.objectKeyCount).toBe(3);
			expect(result.structuredDocument?.source).toBe('inline_json');
			expect(result.structuredDocument?.format).toBe('json');
			expect(result.structuredDocument?.urlCandidates).toEqual([
				{ field: 'url', url: 'https://example.com/' },
				{ field: 'sameAs', url: 'https://example.com/alt' },
			]);
		}
	});

	it('extracts JSON-LD schema metadata from inline objects', async () => {
		const result = await parseAtom(
			'{"@context":"https://schema.org","@type":"MusicRecording","name":"Fixture Track","url":"https://example.com/track"}',
			localOnly
		);
		expect(result.kind).toBe('json');
		if (result.kind === 'json') {
			expect(result.structuredDocument?.format).toBe('jsonld');
			expect(result.structuredDocument?.schemaType).toBe('MusicRecording');
			expect(result.structuredDocument?.context).toBe('https://schema.org');
			expect(result.structuredDocument?.urlCandidates[0]?.url).toBe('https://example.com/track');
		}
	});

	it('detects JSON array', async () => {
		const result = await parseAtom('["https://example.com",42]', localOnly);
		expect(result.kind).toBe('json');
		if (result.kind === 'json') {
			expect(result.topLevelType).toBe('array');
			expect(result.arrayLength).toBe(2);
		}
	});

	it('JSON scalars fall back to plain string', async () => {
		for (const input of ['"9780306406157"', '123', 'true', 'null']) {
			const result = await parseAtom(input, localOnly);
			expect(result.kind).toBe('plain_string');
		}
	});
});

describe('local detection: URL', () => {
	it('detects and normalizes URL', async () => {
		const result = await parseAtom('http://example.com/path/doc.json?download=1', localOnly);
		expect(result.kind).toBe('url');
		if (result.kind === 'url') {
			expect(result.scheme).toBe('http');
			expect(result.host).toBe('example.com');
			expect(result.path).toBe('/path/doc.json');
			expect(result.hasQuery).toBe(true);
		}
	});

	it('URL precedes ISBN when input contains ISBN in path', async () => {
		const result = await parseAtom('https://example.com/9780306406157', localOnly);
		expect(result.kind).toBe('url');
	});

	it('does not classify custom URI schemes as remotely inspectable URLs', async () => {
		for (const input of [
			'did:pkh:eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
			'urn:isbn:9780306406157',
			'ftp://example.com/archive.bin',
		]) {
			const result = await parseAtom(input, localOnly);
			expect(result.kind).toBe('plain_string');
		}
	});

	it('keeps IID-shaped input out of the generic URL lane', async () => {
		for (const input of ['int:isrc:USQX91300108', 'int:isrc:US:QX9:1300108']) {
			const result = await parseAtom(input, localOnly);
			expect(result.kind).not.toBe('url');
		}
	});
});

describe('local detection: ISBN', () => {
	it('detects ISBN-13 with hyphens', async () => {
		const result = await parseAtom('978-0-306-40615-7', localOnly);
		expect(result.kind).toBe('isbn');
		if (result.kind === 'isbn') {
			expect(result.format).toBe('isbn13');
		}
	});

	it('detects ISBN-10 with hyphens', async () => {
		const result = await parseAtom('0-306-40615-2', localOnly);
		expect(result.kind).toBe('isbn');
		if (result.kind === 'isbn') {
			expect(result.format).toBe('isbn10');
		}
	});

	it('detects ISBN-10 without hyphens', async () => {
		const result = await parseAtom('0306406152', localOnly);
		expect(result.kind).toBe('isbn');
	});

	it('invalid ISBN-13 checksum falls back to plain string', async () => {
		const result = await parseAtom('9780306406158', localOnly);
		expect(result.kind).toBe('plain_string');
	});

	it('validates ISBN-10 with X check digit', async () => {
		const result = await parseAtom('155860832X', localOnly);
		expect(result.kind).toBe('isbn');
		if (result.kind === 'isbn') {
			expect(result.format).toBe('isbn10');
			expect(result.checksumValid).toBe(true);
		}
	});
});

describe('local detection: plain string', () => {
	it('falls back for unrecognized input', async () => {
		const result = await parseAtom('  hello world  ', localOnly);
		expect(result.kind).toBe('plain_string');
		if (result.kind === 'plain_string') {
			expect(result.original).toBe('  hello world  ');
			expect(result.trimmed).toBe('hello world');
		}
	});
});

describe('local detection: precedence', () => {
	it('Ethereum address before ENS (0x prefix not .eth)', async () => {
		const addr = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
		const result = await parseAtom(addr, localOnly);
		expect(result.kind).toBe('ethereum_address');
	});

	it('IPFS before Ethereum address', async () => {
		const result = await parseAtom(
			'ipfs://bafybeigdyrzt5rj6uqb6t5x3r7b6g6j4gh7f6wzsp4r4i2l3x6jt6s5z3e',
			localOnly
		);
		expect(result.kind).toBe('ipfs');
	});

	it('ENS before JSON', async () => {
		const result = await parseAtom('vitalik.eth', localOnly);
		expect(result.kind).toBe('ens_name');
	});
});

describe('local detection: Intuition identifiers', () => {
	const forbiddenWdEdgeCharacters = [
		'\uFEFF',
		'\u00A0',
		'\u1680',
		'\u2000',
		'\u2001',
		'\u2002',
		'\u2003',
		'\u2004',
		'\u2005',
		'\u2006',
		'\u2007',
		'\u2008',
		'\u2009',
		'\u200A',
		'\u2028',
		'\u2029',
		'\u202F',
		'\u205F',
		'\u3000',
	] as const;

	it('detects a valid P0 IID before the URL detector', async () => {
		const result = await parseAtom('int:isrc:USQX91300108', localOnly);

		expect(result).toMatchObject({
			kind: 'iid',
			valid: true,
			scheme: 'isrc',
			value: 'USQX91300108',
			canonicalIid: 'int:isrc:USQX91300108',
			anchorEligible: true,
		});
	});

	it('preserves a valid polymorphic IID without making it anchor eligible', async () => {
		const result = await parseAtom('int:wd:Q42', localOnly);

		expect(result).toMatchObject({
			kind: 'iid',
			valid: true,
			scheme: 'wd',
			value: 'Q42',
			canonicalIid: 'int:wd:Q42',
			anchorEligible: false,
		});
	});

	it.each([
		[
			'int:mbid:recording:d28cfc80-b16c-47c9-a370-f13f49732e75',
			'mbid',
			'recording:d28cfc80-b16c-47c9-a370-f13f49732e75',
		],
		[
			'int:gen1:book:r3:59a02a73cbe0d2a4223719fdc4d006ab',
			'gen1',
			'book:r3:59a02a73cbe0d2a4223719fdc4d006ab',
		],
	])('preserves the full in-value-typed value for %s', async (input, scheme, value) => {
		const result = await parseAtom(input, localOnly);

		expect(result).toMatchObject({
			kind: 'iid',
			valid: true,
			scheme,
			value,
			canonicalIid: input,
		});
	});

	it('canonicalizes a valid non-canonical IID value', async () => {
		const result = await parseAtom('int:isbn:0-684-83272-0', localOnly);

		expect(result).toMatchObject({
			kind: 'iid',
			valid: true,
			scheme: 'isbn',
			value: '9780684832722',
			canonicalIid: 'int:isbn:9780684832722',
			anchorEligible: true,
		});
	});

	it('case-folds the prefix and scheme segments without touching the value', async () => {
		const result = await parseAtom('INT:ISRC:usqx91300108', localOnly);

		expect(result).toMatchObject({
			kind: 'iid',
			valid: true,
			scheme: 'isrc',
			value: 'USQX91300108',
			canonicalIid: 'int:isrc:USQX91300108',
			anchorEligible: true,
		});
	});

	it('rejects every TWD-9d Unicode character at either whole-IID edge', async () => {
		for (const edgeCharacter of forbiddenWdEdgeCharacters) {
			const trailing = await parseAtom(`int:wd:film:Q42${edgeCharacter}`, localOnly);
			expect(trailing.kind, `trailing U+${edgeCharacter.codePointAt(0)?.toString(16)}`).toBe('iid');
			if (trailing.kind === 'iid') {
				expect(trailing.valid).toBe(false);
				expect(trailing.anchorEligible).toBe(false);
			}

			const leading = await parseAtom(`${edgeCharacter}int:wd:film:Q42`, localOnly);
			expect(leading.kind, `leading U+${edgeCharacter.codePointAt(0)?.toString(16)}`).not.toBe(
				'iid'
			);
		}
	});

	it('quarantines an uppercase-prefixed malformed IID instead of plain text', async () => {
		const result = await parseAtom('Int:bogus:x', localOnly);

		expect(result).toMatchObject({
			kind: 'iid',
			valid: false,
			scheme: 'bogus',
			reason: 'unknown_or_malformed_iid',
		});
	});

	it.each([
		'int:bogus:x',
		'int:isrc:notanisrc',
		'int:isrc:X',
	])('quarantines malformed IID input instead of falling through: %s', async (input) => {
		const result = await parseAtom(input, localOnly);

		expect(result.kind).toBe('iid');
		if (result.kind === 'iid') {
			expect(result.valid).toBe(false);
			expect(result.canonicalIid).toBeNull();
			expect(result.anchorEligible).toBe(false);
			expect(result.reason).toBeString();
		}
	});
});

it('preserves typed Wikidata and arbitrary colon-bearing values in the IID lane', async () => {
	for (const input of [
		'int:wd:film:Q188035',
		'int:wd:written-work:Q47461344',
		'int:other:value:with:colons',
	]) {
		const result = await parseAtom(input, localOnly);
		expect(result.kind).toBe('iid');
		expect(result.normalizedInput).toBe(input);
		if (result.kind === 'iid') {
			expect(result.value).toBe(input.split(':').slice(2).join(':'));
		}
	}
});
