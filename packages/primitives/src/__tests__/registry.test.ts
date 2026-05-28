import { describe, expect, it } from 'vitest';

import {
	buildAtomData,
	buildAtomDataObject,
	CLASSIFICATION_SLUGS,
	CLASSIFICATION_SPECS,
	getClassification,
	getClassificationsByCategory,
	hasClassification,
	validateClassificationValues,
} from '../index';

describe('classification registry', () => {
	it('exposes the complete 37-classification catalog', () => {
		expect(CLASSIFICATION_SPECS).toHaveLength(37);
		expect(CLASSIFICATION_SLUGS).toHaveLength(37);
		expect(new Set(CLASSIFICATION_SLUGS).size).toBe(37);
		expect(CLASSIFICATION_SLUGS).toContain('person');
		expect(CLASSIFICATION_SLUGS).toContain('ethereum-erc20');
	});

	it('looks up a classification by slug', () => {
		expect(getClassification('person')).toMatchObject({
			slug: 'person',
			type: 'Person',
			category: 'Entity',
			defaults: {
				pluginId: 'person',
				provider: 'wikidata',
			},
		});
		expect(hasClassification('person')).toBe(true);
		expect(hasClassification('missing')).toBe(false);
	});

	it('filters by category', () => {
		const blockchain = getClassificationsByCategory('Blockchain');

		expect(blockchain.map((spec) => spec.slug)).toEqual([
			'ethereum-account',
			'ethereum-erc20',
			'ethereum-smart-contract',
		]);
	});

	it('freezes the public registry data at runtime', () => {
		expect(Object.isFrozen(CLASSIFICATION_SPECS)).toBe(true);
		expect(Object.isFrozen(CLASSIFICATION_SLUGS)).toBe(true);
		expect(Object.isFrozen(CLASSIFICATION_SPECS[0])).toBe(true);
		expect(Object.isFrozen(CLASSIFICATION_SPECS[0]?.fields)).toBe(true);
	});
});

describe('classification atom data', () => {
	it('builds schema-backed atom data for person', () => {
		expect(
			buildAtomDataObject('person', {
				givenName: 'Vitalik',
				familyName: 'Buterin',
			})
		).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Person',
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});
	});

	it('builds Intuition schema-backed atom data for blockchain classifications', () => {
		expect(
			buildAtomData('ethereum-erc20', {
				chainId: '1',
				address: '0x0000000000000000000000000000000000000001',
				name: 'Ether',
				symbol: 'ETH',
				decimals: '18',
			})
		).toBe(
			'{"@context":"https://schema.intuition.systems/v1/ethereum.jsonld","@type":"EthereumERC20","chainId":"1","address":"0x0000000000000000000000000000000000000001","name":"Ether","symbol":"ETH","decimals":"18"}'
		);
	});

	it('reports validation issues without throwing', () => {
		expect(
			validateClassificationValues('web-page', {
				name: '',
				url: 'not-a-url',
				extra: true,
			})
		).toEqual([
			{
				field: 'extra',
				message: 'Unknown field "extra" for classification "web-page".',
			},
			{
				field: 'name',
				message: 'Field "name" must be a non-empty string.',
			},
			{
				field: 'url',
				message: 'Field "url" must be a valid URL string.',
			},
		]);
	});

	it('throws on invalid required values', () => {
		expect(() =>
			buildAtomData('person', {
				givenName: 'Vitalik',
			})
		).toThrow('Missing required field "familyName".');
	});

	it('throws on invalid ethereum addresses', () => {
		expect(() =>
			buildAtomData('ethereum-account', {
				address: '0x1234',
			})
		).toThrow('Field "address" must be a valid Ethereum address.');
	});

	it('throws on unknown classifications', () => {
		expect(() => buildAtomData('missing', {})).toThrow('Unknown classification "missing".');
	});
});
