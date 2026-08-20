import { describe, expect, it } from 'vitest';

import { buildIidAnchor, DEFAULT_URI_LIMITS } from '../anchor.js';
import { recognizeAtomData } from '../validate.js';

describe('buildIidAnchor', () => {
	it('golden P0 ISRC: exact UTF-8 bytes and atom ID', () => {
		const result = buildIidAnchor('music-recording', { isrc: 'US-RC1-76-07839' });

		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.value.iid).toBe('int:isrc:USRC17607839');
		expect(result.value.profile).toBe('p0');
		expect(result.value.data).toBe('int:isrc:USRC17607839');
		expect(result.value.dataHex).toBe('0x696e743a697372633a555352433137363037383339');
		expect(result.value.id).toBe(
			'0xd3368a8190d3afd5fb05abd01db8141c09a77c3f290bb7a0ef2ffb2b5acab8d8'
		);
		expect(result.value.classification).toBe('music-recording');
		expect(result.value.class).toBe('A');
		expect(result.value.providerPlan).toEqual(['musicbrainz', 'spotify', 'apple-music']);
		expect(recognizeAtomData(result.value.data)).toBe('iid-anchor');
	});

	it('Class C identities cannot emit bare P0', () => {
		const values = { givenName: 'Ada', familyName: 'Lovelace' };

		const defaulted = buildIidAnchor('person', values);
		expect(defaulted.success).toBe(true);
		if (defaulted.success) {
			expect(defaulted.value.profile).toBe('p1'); // floors, never bare
			expect(defaulted.value.class).toBe('C');
			const parsed = JSON.parse(defaulted.value.data);
			expect(parsed['@type']).toBe('Person');
			expect(parsed.identifier).toBe(defaulted.value.iid);
			expect(parsed.givenName).toBe('Ada'); // preimage evidence travels
			expect(parsed.familyName).toBe('Lovelace');
		}

		const forced = buildIidAnchor('person', values, { profile: 'p0' });
		expect(forced.success).toBe(false);
		if (!forced.success) {
			expect(forced.errors[0]).toMatch(/cannot mint as a bare P0 anchor/);
		}
	});

	it('polymorphic schemes cannot emit bare P0', () => {
		// movie ladder tops out at wd via sameAs — polymorphic.
		const result = buildIidAnchor(
			'movie',
			{ sameAs: ['https://www.wikidata.org/wiki/Q25188'] },
			{ profile: 'p0' }
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0]).toMatch(/polymorphic/);
		}
	});

	it('URI context never changes the atom ID', () => {
		const bare = buildIidAnchor('music-recording', { isrc: 'USRC17607839' });
		const withUris = buildIidAnchor(
			'music-recording',
			{ isrc: 'USRC17607839' },
			{ contextUris: ['https://app.example.com/track/1', 'ipfs://bafy123'] }
		);

		expect(bare.success && withUris.success).toBe(true);
		if (!bare.success || !withUris.success) return;

		expect(withUris.value.id).toBe(bare.value.id);
		expect(withUris.value.data).toBe(bare.value.data);
		expect(withUris.value.contextUris).toEqual([
			'https://app.example.com/track/1',
			'ipfs://bafy123',
		]);
	});

	it('URI manifest is ordered, trimmed, and exact-deduplicated', () => {
		const result = buildIidAnchor(
			'music-recording',
			{ isrc: 'USRC17607839' },
			{
				contextUris: ['  https://a.example/1  ', 'https://b.example/2', 'https://a.example/1', ''],
			}
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.contextUris).toEqual(['https://a.example/1', 'https://b.example/2']);
		}
	});

	it('URI policy limits reject before any wallet interaction', () => {
		const tooMany = buildIidAnchor(
			'music-recording',
			{ isrc: 'USRC17607839' },
			{ contextUris: ['u://1', 'u://2', 'u://3', 'u://4', 'u://5', 'u://6'] }
		);
		expect(tooMany.success).toBe(false);
		if (!tooMany.success) {
			expect(tooMany.errors[0]).toMatch(/limit is 5/);
		}

		const tooLong = buildIidAnchor(
			'music-recording',
			{ isrc: 'USRC17607839' },
			{ contextUris: [`https://example.com/${'a'.repeat(700)}`] }
		);
		expect(tooLong.success).toBe(false);

		const liveLimits = buildIidAnchor(
			'music-recording',
			{ isrc: 'USRC17607839' },
			{ contextUris: ['u://1', 'u://2'], uriLimits: { maxUris: 1, maxUriBytes: 64 } }
		);
		expect(liveLimits.success).toBe(false);

		expect(DEFAULT_URI_LIMITS).toEqual({ maxUris: 5, maxUriBytes: 700 });
	});

	it('reordered equivalent sameAs input produces deterministic output', () => {
		const forward = buildIidAnchor('movie', {
			sameAs: ['https://www.wikidata.org/wiki/Q25188', 'https://www.wikidata.org/wiki/Q42'],
		});
		const reversed = buildIidAnchor('movie', {
			sameAs: ['https://www.wikidata.org/wiki/Q42', 'https://www.wikidata.org/wiki/Q25188'],
		});

		expect(forward.success && reversed.success).toBe(true);
		if (forward.success && reversed.success) {
			expect(forward.value.iid).toBe(reversed.value.iid);
			expect(forward.value.data).toBe(reversed.value.data);
			expect(forward.value.id).toBe(reversed.value.id);
		}
	});

	it('gen1 P1 payload has frozen key order and deterministic bytes', () => {
		const first = buildIidAnchor('person', { givenName: 'Ada', familyName: 'Lovelace' });
		const second = buildIidAnchor('person', { familyName: 'Lovelace', givenName: 'Ada' });

		expect(first.success && second.success).toBe(true);
		if (first.success && second.success) {
			expect(first.value.data).toBe(second.value.data);
			expect(first.value.id).toBe(second.value.id);
			expect(first.value.data.indexOf('"@context"')).toBeLessThan(
				first.value.data.indexOf('"@type"')
			);
			expect(first.value.data.indexOf('"@type"')).toBeLessThan(
				first.value.data.indexOf('"identifier"')
			);
		}
	});

	it('unknown classification and unfired ladders are structured errors', () => {
		expect(buildIidAnchor('not-a-thing', {}).success).toBe(false);

		const noRung = buildIidAnchor('music-recording', {});
		expect(noRung.success).toBe(false);
		if (!noRung.success) {
			expect(noRung.errors[0]).toMatch(/No identity rung fired/);
		}
	});
});

describe('recognizeAtomData', () => {
	it('recognizes canonical IID anchors without reclassifying arbitrary strings', () => {
		expect(recognizeAtomData('int:isrc:USRC17607839')).toBe('iid-anchor');
		expect(recognizeAtomData('int:isbn:0-684-83272-0')).toBe('invalid'); // non-canonical
		expect(recognizeAtomData('int:src:whatever')).toBe('invalid'); // unknown scheme
		expect(recognizeAtomData('{"@type":"Person"}')).toBe('json-object');
		expect(recognizeAtomData('42')).toBe('invalid');
		expect(recognizeAtomData('not json')).toBe('invalid');
	});
});
