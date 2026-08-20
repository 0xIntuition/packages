/**
 * Golden-path fixtures through the registry — computed live from the
 * shipped packages (ladders + canonicalizers), never hardcoded derivations.
 */
import { identityLadderFor } from '@0xintuition/classifications';
import { deriveIntuitionId, isAnchorEligible } from '@0xintuition/iid';
import { describe, expect, it } from 'vitest';

import { classificationForIid } from '../classification.js';

describe('golden-path fixtures', () => {
	it('P0 isrc anchor classifies as music-recording', () => {
		const iid = 'int:isrc:USUM71703861';
		expect(isAnchorEligible(iid)).toBe(true);
		expect(classificationForIid(iid)?.slug).toBe('music-recording');
	});

	it('gen1 person IID derived through the real ladder classifies as person', () => {
		const ladder = identityLadderFor('person');
		expect(ladder).toBeDefined();

		const derived = ladder
			? deriveIntuitionId(ladder, { givenName: 'Ada', familyName: 'Lovelace' })
			: undefined;

		expect(derived?.scheme).toBe('gen1');
		// Class C never anchors as P0 — but it still classifies.
		expect(derived ? isAnchorEligible(derived.iid) : undefined).toBe(false);
		expect(derived ? classificationForIid(derived.iid)?.slug : undefined).toBe('person');
	});

	it('bare polymorphic IID is valid but classifies undefined (enrich anyway)', () => {
		expect(classificationForIid('int:wd:Q42')).toBeUndefined();
	});

	it('non-canonical valid isbn classifies as book but can never anchor (read-compatibility)', () => {
		const nonCanonical = 'int:isbn:0-684-83272-0';
		expect(isAnchorEligible(nonCanonical)).toBe(false);
		expect(classificationForIid(nonCanonical)?.slug).toBe('book');
	});

	it('malformed IIDs classify undefined', () => {
		expect(classificationForIid('int:isrc:XYZ')).toBeUndefined();
	});

	it('legacy JSON atom data is not an IID and classifies undefined', () => {
		const legacy = JSON.stringify({
			'@context': 'https://schema.org/',
			'@type': 'MusicRecording',
			name: 'One Last Time',
		});
		expect(classificationForIid(legacy)).toBeUndefined();
	});
});
