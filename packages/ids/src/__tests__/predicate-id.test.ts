import { describe, expect, it } from 'vitest';

import { calculateAtomId } from '../atom-id';
import { calculatePredicateId, createPredicateAtomData } from '../predicate-id';
import { isValidAtomId } from '../validate';

describe('createPredicateAtomData', () => {
	it('produces the canonical JSON-LD string with fixed key ordering', () => {
		const atomData = createPredicateAtomData('follow', 'Directional subscription');
		expect(atomData).toBe(
			'{"@context":"https://schema.org/","@type":"DefinedTerm","name":"follow","description":"Directional subscription"}'
		);
	});

	it('is deterministic for the same inputs', () => {
		const a = createPredicateAtomData('is', 'Identity assertion');
		const b = createPredicateAtomData('is', 'Identity assertion');
		expect(a).toBe(b);
	});
});

describe('calculatePredicateId', () => {
	it('matches the known follow predicate ID', () => {
		const id = calculatePredicateId('follow', 'Directional subscription');
		expect(id).toBe('0xdb3dc8c92d6141c4e0c9b453b00fc1f237624ef8373b6ae9972d09557d8aaa8d');
	});

	it('matches the known is predicate ID', () => {
		const id = calculatePredicateId(
			'is',
			'Asserts identity, type membership, or definitional equivalence between subject and object'
		);
		expect(id).toBe('0x9ccbabaea0e620c777a478e03fa4897546f105dca939b050a5620c1b6eca740c');
	});

	it('is equivalent to calculateAtomId(createPredicateAtomData(...))', () => {
		const atomData = createPredicateAtomData('follow', 'Directional subscription');
		const fromAtomId = calculateAtomId(atomData);
		const fromPredicateId = calculatePredicateId('follow', 'Directional subscription');
		expect(fromPredicateId).toBe(fromAtomId);
	});

	it('produces different IDs for different predicates', () => {
		const followId = calculatePredicateId('follow', 'Directional subscription');
		const isId = calculatePredicateId(
			'is',
			'Asserts identity, type membership, or definitional equivalence between subject and object'
		);
		expect(followId).not.toBe(isId);
	});

	it('returns a valid atom ID format', () => {
		const id = calculatePredicateId('follow', 'Directional subscription');
		expect(isValidAtomId(id)).toBe(true);
	});
});
