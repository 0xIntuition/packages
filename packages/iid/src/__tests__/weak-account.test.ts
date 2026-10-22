import { describe, expect, it } from 'vitest';

import { inspectIntuitionId, isAnchorEligible, validateIntuitionId } from '../parse.js';
import { SCHEMES } from '../schemes.js';

describe('weak account eligibility floor', () => {
	it.each([
		'twitter:@jack',
		'github:@torvalds',
		'x:@jack:other',
	])('keeps %s valid and unambiguous but ineligible with a weak-account reason', (value) => {
		const iid = `int:acct:${value}`;
		expect(validateIntuitionId(iid)).toBe(true);
		expect(isAnchorEligible(iid)).toBe(false);
		expect(inspectIntuitionId(iid)).toEqual({
			valid: true,
			iid,
			scheme: 'acct',
			value,
			class: 'B',
			typing: 'unambiguous',
			anchorEligible: false,
			anchorIneligibilityReason: 'weak-account',
		});
	});

	it.each([
		'x:44196397',
		'github:MonaLisa',
		'x:id:@jack',
	])('keeps strong form %s eligible, including an embedded :@ after the ID starts', (value) => {
		const iid = `int:acct:${value}`;
		expect(validateIntuitionId(iid)).toBe(true);
		expect(isAnchorEligible(iid)).toBe(true);
		expect(inspectIntuitionId(iid)).toMatchObject({
			valid: true,
			iid,
			typing: 'unambiguous',
			anchorEligible: true,
		});
		expect(inspectIntuitionId(iid)).not.toHaveProperty('anchorIneligibilityReason');
	});

	it.each([
		['twitter:@Jack', 'twitter:@jack'],
		['GitHub:MonaLisa', 'github:MonaLisa'],
	])('preserves canonical bytes for %s', (raw, canonical) => {
		expect(SCHEMES.acct.canonicalize(raw)).toBe(canonical);
		expect(SCHEMES.acct.canonicalize(canonical)).toBe(canonical);
	});

	it('keeps noncanonical weak handles invalid and reports their canonical repair', () => {
		expect(isAnchorEligible('int:acct:twitter:@Jack')).toBe(false);
		expect(inspectIntuitionId('int:acct:twitter:@Jack')).toEqual({
			valid: false,
			reason: 'noncanonical',
			scheme: 'acct',
			value: 'twitter:@Jack',
			canonical: 'int:acct:twitter:@jack',
		});
	});
});
