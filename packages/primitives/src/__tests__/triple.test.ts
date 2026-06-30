import { I_SUBJECT_ID, PREDICATE_IDS } from '@0xintuition/predicates';
import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import {
	buildAtom,
	buildCounterTriple,
	buildTriple,
	buildTripleByName,
	calculateCounterTripleId,
	calculateTripleId,
	explainTriple,
	guidedBuildTriple,
} from '../index';

// Build some test atoms to use as subjects/objects
function getTestAtomId(classificationSlug: string, values: Record<string, unknown>): Hex {
	const result = buildAtom(classificationSlug, values);

	if (!result.success) {
		throw new Error(`Failed to build test atom: ${result.errors.join(', ')}`);
	}

	return result.value.id;
}

describe('buildTriple', () => {
	it('builds a triple with a known predicate key', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});
		const objectId = getTestAtomId('company', { name: 'Ethereum Foundation' });

		const result = buildTriple(subjectId, 'follow', objectId);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.subjectId).toBe(subjectId);
		expect(result.value.objectId).toBe(objectId);
		expect(result.value.predicateKey).toBe('follow');
		expect(result.value.predicateId).toBe(PREDICATE_IDS.follow);
		expect(result.value.id).toMatch(/^0x[a-f0-9]{64}$/);
	});

	it('produces a deterministic triple ID matching the canonical algorithm', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'Example',
		});
		const objectId = getTestAtomId('thing', { name: 'Decentralization' });
		const predicateId = PREDICATE_IDS.hasTag;

		const result = buildTriple(subjectId, 'hasTag', objectId);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		// Verify against the canonical ID calculation
		const expectedId = calculateTripleId(subjectId, predicateId, objectId);

		expect(result.value.id).toBe(expectedId);
	});

	it('returns an error for unknown predicate keys', () => {
		const subjectId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
		const objectId = '0x0000000000000000000000000000000000000000000000000000000000000002' as Hex;

		const result = buildTriple(subjectId, 'nonexistentPredicate', objectId);

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Unknown predicate key "nonexistentPredicate".');
	});

	it('produces different IDs for different subject/object/predicate combinations', () => {
		const atom1 = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const atom2 = getTestAtomId('person', {
			givenName: 'Bob',
			familyName: 'B',
		});

		const result1 = buildTriple(atom1, 'follow', atom2);
		const result2 = buildTriple(atom2, 'follow', atom1);

		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);

		if (!result1.success || !result2.success) {
			return;
		}

		// Same predicate, different direction => different triple ID
		expect(result1.value.id).not.toBe(result2.value.id);
	});

	it('produces deterministic IDs for identical inputs', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const objectId = getTestAtomId('thing', { name: 'Web3' });

		const result1 = buildTriple(subjectId, 'hasTag', objectId);
		const result2 = buildTriple(subjectId, 'hasTag', objectId);

		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);

		if (!result1.success || !result2.success) {
			return;
		}

		expect(result1.value.id).toBe(result2.value.id);
	});
});

describe('buildTripleByName', () => {
	it('builds a triple using a predicate name instead of key', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const objectId = getTestAtomId('thing', { name: 'Intuition' });

		const result = buildTripleByName(subjectId, 'has tag', objectId);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.predicateKey).toBe('hasTag');
		expect(result.value.predicateId).toBe(PREDICATE_IDS.hasTag);
	});

	it('handles case-insensitive predicate name lookup', () => {
		const subjectId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
		const objectId = '0x0000000000000000000000000000000000000000000000000000000000000002' as Hex;

		const result = buildTripleByName(subjectId, 'FOLLOW', objectId);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.predicateKey).toBe('follow');
	});

	it('handles whitespace in predicate names', () => {
		const subjectId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
		const objectId = '0x0000000000000000000000000000000000000000000000000000000000000002' as Hex;

		const result = buildTripleByName(subjectId, '  follow  ', objectId);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.predicateKey).toBe('follow');
	});

	it('returns an error for unknown predicate names', () => {
		const subjectId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
		const objectId = '0x0000000000000000000000000000000000000000000000000000000000000002' as Hex;

		const result = buildTripleByName(subjectId, 'totally made up', objectId);

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Unknown predicate name "totally made up".');
	});

	it('produces the same triple as buildTriple with the equivalent key', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const objectId = getTestAtomId('company', { name: 'Intuition Labs' });

		const byKey = buildTriple(subjectId, 'follow', objectId);
		const byName = buildTripleByName(subjectId, 'follow', objectId);

		expect(byKey.success).toBe(true);
		expect(byName.success).toBe(true);

		if (!byKey.success || !byName.success) {
			return;
		}

		expect(byName.value.id).toBe(byKey.value.id);
		expect(byName.value.predicateId).toBe(byKey.value.predicateId);
	});
});

describe('guidedBuildTriple', () => {
	it('builds a bookmark triple with behavior interpretation', () => {
		const subjectId = getTestAtomId('ethereum-account', {
			address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
		});
		const objectId = getTestAtomId('thing', { name: 'Predicate behavior note' });

		const result = guidedBuildTriple({
			subjectId,
			predicateKey: 'bookmark',
			objectId,
			subjectLabel: '0x742d...f44e',
			objectLabel: 'Predicate behavior note',
			actorSource: 'subject',
			subjectClassification: 'ethereum-account',
			objectClassification: 'thing',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.predicateKey).toBe('bookmark');
		expect(result.value.behavior?.subjectRole).toBe('bookmarker');
		expect(result.value.interpretation).toMatchObject({
			subjectRole: 'bookmarker',
			objectRole: 'bookmarked target',
			actorSource: 'subject',
			plainEnglish: '0x742d...f44e bookmarks Predicate behavior note',
		});
		expect(result.value.warnings).toEqual([]);
	});

	it('rejects an inverted bookmark triple when classification context is supplied', () => {
		const subjectId = getTestAtomId('thing', { name: 'Predicate behavior note' });
		const objectId = getTestAtomId('ethereum-account', {
			address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
		});

		const result = guidedBuildTriple({
			subjectId,
			predicateKey: 'bookmark',
			objectId,
			subjectLabel: 'Predicate behavior note',
			objectLabel: '0x742d...f44e',
			actorSource: 'subject',
			subjectClassification: 'thing',
			objectClassification: 'ethereum-account',
		});

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain(
			'Invalid subject placement: expected classification:ethereum-account or classification:person or classification:social-media-account, received classification:thing.'
		);
	});

	it('explains follow as a position-backed canonical claim', () => {
		const result = explainTriple({
			predicateKey: 'follow',
			subjectLabel: 'I',
			objectLabel: 'Geo Browser',
			actorLabel: '0x742d...f44e',
			actorSource: 'position',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value).toMatchObject({
			subjectRole: 'first-person actor placeholder',
			objectRole: 'followed target',
			actorSource: 'position',
			actorRole: 'follower',
			plainEnglish: '0x742d...f44e via position: I follows Geo Browser',
		});
	});

	it('warns when the supplied actor source does not match predicate behavior', () => {
		const objectId = getTestAtomId('thing', { name: 'Geo Browser' });

		const result = guidedBuildTriple({
			subjectId: I_SUBJECT_ID,
			predicateKey: 'follow',
			objectId,
			subjectLabel: 'I',
			objectLabel: 'Geo Browser',
			actorSource: 'subject',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.warnings).toContain(
			'Actor source "subject" does not match canonical source "position".'
		);
	});
});

describe('buildCounterTriple', () => {
	it('builds a counter-triple with a deterministic ID', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const objectId = getTestAtomId('person', {
			givenName: 'Bob',
			familyName: 'B',
		});

		const tripleResult = buildTriple(subjectId, 'follow', objectId);

		expect(tripleResult.success).toBe(true);

		if (!tripleResult.success) {
			return;
		}

		const counter = buildCounterTriple(tripleResult.value);

		expect(counter.tripleId).toBe(tripleResult.value.id);
		expect(counter.id).toMatch(/^0x[a-f0-9]{64}$/);
		expect(counter.id).not.toBe(tripleResult.value.id);
		expect(counter.subjectId).toBe(subjectId);
		expect(counter.predicateKey).toBe('follow');
		expect(counter.predicateId).toBe(PREDICATE_IDS.follow);
		expect(counter.objectId).toBe(objectId);
	});

	it('produces a deterministic counter-triple ID matching the canonical algorithm', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const objectId = getTestAtomId('thing', { name: 'Web3' });

		const tripleResult = buildTriple(subjectId, 'hasTag', objectId);

		expect(tripleResult.success).toBe(true);

		if (!tripleResult.success) {
			return;
		}

		const counter = buildCounterTriple(tripleResult.value);

		// Verify against the canonical ID calculation
		const expectedId = calculateCounterTripleId(tripleResult.value.id);

		expect(counter.id).toBe(expectedId);
	});

	it('produces deterministic IDs for identical inputs', () => {
		const subjectId = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const objectId = getTestAtomId('thing', { name: 'DeFi' });

		const triple1 = buildTriple(subjectId, 'hasTag', objectId);
		const triple2 = buildTriple(subjectId, 'hasTag', objectId);

		expect(triple1.success).toBe(true);
		expect(triple2.success).toBe(true);

		if (!triple1.success || !triple2.success) {
			return;
		}

		const counter1 = buildCounterTriple(triple1.value);
		const counter2 = buildCounterTriple(triple2.value);

		expect(counter1.id).toBe(counter2.id);
	});

	it('produces different counter-triple IDs for different triples', () => {
		const atom1 = getTestAtomId('person', {
			givenName: 'Alice',
			familyName: 'A',
		});
		const atom2 = getTestAtomId('person', {
			givenName: 'Bob',
			familyName: 'B',
		});

		const triple1 = buildTriple(atom1, 'follow', atom2);
		const triple2 = buildTriple(atom2, 'follow', atom1);

		expect(triple1.success).toBe(true);
		expect(triple2.success).toBe(true);

		if (!triple1.success || !triple2.success) {
			return;
		}

		const counter1 = buildCounterTriple(triple1.value);
		const counter2 = buildCounterTriple(triple2.value);

		expect(counter1.id).not.toBe(counter2.id);
	});
});
