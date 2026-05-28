import { describe, expect, it } from 'vitest';

import {
	buildPredicateIpfsDocument,
	computePredicateAtomId,
	createIpfsUri,
	getPredicateNameFromAtomData,
	getStrategyAtomData,
	isIpfsUri,
	isPredicateAtomDocument,
	parsePredicateAtomData,
} from './index';

describe('@0xintuition/predicates atom data strategies', () => {
	it('parses inline predicate atoms and ipfs URIs', () => {
		const inline = parsePredicateAtomData(
			'{"@context":"https://schema.org/","@type":"DefinedTerm","name":"follow","description":"Directional subscription"}'
		);
		const ipfs = parsePredicateAtomData('ipfs://bafy-test');

		expect(inline).toEqual({
			kind: 'inline',
			value: {
				'@context': 'https://schema.org/',
				'@type': 'DefinedTerm',
				name: 'follow',
				description: 'Directional subscription',
			},
		});
		expect(ipfs).toEqual({
			kind: 'ipfs',
			value: 'ipfs://bafy-test',
		});
		expect(() => parsePredicateAtomData('follow')).toThrow('Unsupported predicate atom data');
		expect(getPredicateNameFromAtomData('follow')).toBeUndefined();
		expect(getPredicateNameFromAtomData('ipfs://bafy-test')).toBeUndefined();
	});

	it('rejects invalid predicate atom data that is neither canonical json nor ipfs', () => {
		expect(() => parsePredicateAtomData('{"name":"follow"}')).toThrow(
			'Unsupported predicate atom data'
		);
		expect(() => parsePredicateAtomData('https://example.com/follow.json')).toThrow(
			'Unsupported predicate atom data'
		);
	});

	it('emits non-default semantic flags and inverse predicate in ipfs documents', () => {
		const document = buildPredicateIpfsDocument('contain', {
			description: 'The subject collection or container includes the object as a member or entry',
			marketPattern: 'attributive',
			conjugates: true,
			i18n: {
				en: {
					base: 'contain',
					thirdPerson: 'contains',
					displayName: 'Contain',
				},
			},
			isHierarchical: true,
			inversePredicate: 'listed in',
		});

		expect(document.additionalProperty).toContainEqual({
			'@type': 'PropertyValue',
			name: 'isHierarchical',
			value: true,
		});
		expect(document.additionalProperty).toContainEqual({
			'@type': 'PropertyValue',
			name: 'inversePredicate',
			value: 'listed in',
		});
		expect(document.additionalProperty.some((entry) => entry.name === 'isTransitive')).toBe(false);
		expect(document.additionalProperty.some((entry) => entry.name === 'isSymmetric')).toBe(false);
	});

	it('omits semantic flags when they are explicitly set to false', () => {
		const document = buildPredicateIpfsDocument('follow', {
			description: 'Directional subscription or tracking of the object entity',
			marketPattern: 'depositional',
			conjugates: true,
			i18n: {
				en: {
					base: 'follow',
					thirdPerson: 'follows',
					displayName: 'Follow',
				},
			},
			isTransitive: false,
		});

		expect(document.additionalProperty.some((entry) => entry.name === 'isTransitive')).toBe(false);
	});

	it('normalizes and validates ipfs URIs', () => {
		expect(createIpfsUri('bafy-test')).toBe('ipfs://bafy-test');
		expect(createIpfsUri(' ipfs://bafy-test ')).toBe('ipfs://bafy-test');
		expect(isIpfsUri('ipfs://bafy-test')).toBe(true);
		expect(isIpfsUri('https://example.com')).toBe(false);
		expect(() => createIpfsUri('  ')).toThrow('CID required');
	});

	it('builds predicate ipfs documents and computes strategy-specific atom ids', () => {
		const document = buildPredicateIpfsDocument('follow', {
			description: 'Directional subscription or tracking of the object entity',
			sameAs: ['https://schema.org/FollowAction'],
			marketPattern: 'depositional',
			conjugates: true,
			i18n: {
				en: {
					base: 'follow',
					thirdPerson: 'follows',
					displayName: 'Follow',
				},
				fr: {
					base: 'suivre',
					thirdPerson: 'suit',
					displayName: 'Suivre',
					direction: 'ltr',
				},
			},
		});

		expect(isPredicateAtomDocument(document)).toBe(true);
		expect(document.alternateName).toEqual([
			{
				'@language': 'fr',
				'@value': 'suivre',
			},
		]);
		expect(document.additionalProperty).toContainEqual(
			expect.objectContaining({
				name: 'marketPattern',
				value: 'depositional',
			})
		);
		expect(document.additionalProperty.some((entry) => entry.name === 'isTransitive')).toBe(false);
		expect(document.additionalProperty.some((entry) => entry.name === 'isSymmetric')).toBe(false);
		expect(document.additionalProperty.some((entry) => entry.name === 'isHierarchical')).toBe(
			false
		);
		expect(document.additionalProperty.some((entry) => entry.name === 'inversePredicate')).toBe(
			false
		);
		expect(getStrategyAtomData('follow')).toContain('"name":"follow"');
		expect(getStrategyAtomData('follow', 'ipfs', 'bafy-follow')).toBe('ipfs://bafy-follow');
		expect(computePredicateAtomId('follow')).not.toBe(
			computePredicateAtomId('follow', 'ipfs', 'bafy-follow')
		);
		expect(() => getStrategyAtomData('follow', 'ipfs')).toThrow('CID required');
	});
});
