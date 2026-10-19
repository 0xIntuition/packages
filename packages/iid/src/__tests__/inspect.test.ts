import { describe, expect, it } from 'vitest';

import { inspectIntuitionId } from '../parse.js';

describe('inspectIntuitionId', () => {
	it('reports a valid anchor-eligible IID with full metadata', () => {
		const inspection = inspectIntuitionId('int:isrc:USRC17607839');

		expect(inspection).toEqual({
			valid: true,
			iid: 'int:isrc:USRC17607839',
			scheme: 'isrc',
			value: 'USRC17607839',
			class: 'A',
			typing: 'unambiguous',
			anchorEligible: true,
		});
	});

	it('distinguishes polymorphic-scheme ineligibility from class-c', () => {
		const wd = inspectIntuitionId('int:wd:Q42');
		expect(wd.valid && wd.anchorIneligibilityReason).toBe('polymorphic-scheme');

		const gen1 = inspectIntuitionId('int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a');
		expect(gen1.valid && gen1.anchorIneligibilityReason).toBe('class-c');
	});

	it('reports malformed inputs', () => {
		for (const input of ['', 'isbn:9780684832722', 'INT:isbn:9780684832722', 'int:isbn:']) {
			expect(inspectIntuitionId(input)).toEqual({ valid: false, reason: 'malformed' });
		}
	});

	it('rejects space and non-ASCII in values as malformed (grammar %x21-7E)', () => {
		expect(inspectIntuitionId('int:isbn:97806848 32722').valid).toBe(false);
		expect(inspectIntuitionId('int:isbn:97806848 32722')).toMatchObject({ reason: 'malformed' });
		expect(inspectIntuitionId('int:isbn:9780684832722é')).toMatchObject({ reason: 'malformed' });
	});

	it('reports unknown schemes without repairing them (closed registry)', () => {
		expect(inspectIntuitionId('int:src:anything')).toEqual({
			valid: false,
			reason: 'unknown-scheme',
			scheme: 'src',
			value: 'anything',
		});
	});

	it('reports noncanonical values with the canonical repair when one exists', () => {
		expect(inspectIntuitionId('int:isbn:0-684-83272-0')).toEqual({
			valid: false,
			reason: 'noncanonical',
			scheme: 'isbn',
			value: '0-684-83272-0',
			canonical: 'int:isbn:9780684832722',
		});
	});

	it('reports noncanonical values with no repair when the value is unsalvageable', () => {
		const inspection = inspectIntuitionId('int:isbn:9780684832723'); // bad check digit
		expect(inspection).toEqual({
			valid: false,
			reason: 'noncanonical',
			scheme: 'isbn',
			value: '9780684832723',
		});
	});
});

describe('typed Wikidata inspection', () => {
	it.each([
		['film', 'Q188035'],
		['television-series', 'Q137400033'],
		['human', 'Q42'],
	])('reports an active %s binding as unambiguous and eligible', (wdSlug, qid) => {
		const value = `${wdSlug}:${qid}`;
		expect(inspectIntuitionId(`int:wd:${value}`)).toEqual({
			valid: true,
			iid: `int:wd:${value}`,
			scheme: 'wd',
			value,
			class: 'A',
			typing: 'unambiguous',
			anchorEligible: true,
			wdSlug,
		});
	});

	it('reports a dormant binding as valid, typed and ineligible', () => {
		expect(inspectIntuitionId('int:wd:written-work:Q47461344')).toEqual({
			valid: true,
			iid: 'int:wd:written-work:Q47461344',
			scheme: 'wd',
			value: 'written-work:Q47461344',
			class: 'A',
			typing: 'unambiguous',
			anchorEligible: false,
			anchorIneligibilityReason: 'dormant-wd-binding',
			wdSlug: 'written-work',
		});
	});

	it('preserves bare Wikidata inspection byte-for-byte', () => {
		expect(inspectIntuitionId('int:wd:Q42')).toEqual({
			valid: true,
			iid: 'int:wd:Q42',
			scheme: 'wd',
			value: 'Q42',
			class: 'A',
			typing: 'polymorphic',
			anchorEligible: false,
			anchorIneligibilityReason: 'polymorphic-scheme',
		});
	});

	it('repairs noncanonical typed values and rejects unknown slugs without a repair', () => {
		expect(inspectIntuitionId('int:wd:film:q42')).toEqual({
			valid: false,
			reason: 'noncanonical',
			scheme: 'wd',
			value: 'film:q42',
			canonical: 'int:wd:film:Q42',
		});
		expect(inspectIntuitionId('int:wd:bogus:Q1')).toEqual({
			valid: false,
			reason: 'noncanonical',
			scheme: 'wd',
			value: 'bogus:Q1',
		});
	});
});
