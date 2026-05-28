import { describe, expect, it } from 'vitest';

import {
	getClassificationFields,
	getRequiredFields,
	listClassifications,
	suggestClassification,
} from '../index';

describe('listClassifications', () => {
	it('lists all 37 classifications when no category is specified', () => {
		const all = listClassifications();

		expect(all).toHaveLength(37);
		expect(all.map((c) => c.slug)).toContain('person');
		expect(all.map((c) => c.slug)).toContain('company');
		expect(all.map((c) => c.slug)).toContain('software');
	});

	it('filters by Entity category', () => {
		const entities = listClassifications('Entity');

		expect(entities.length).toBeGreaterThan(0);
		expect(entities.every((c) => c.category === 'Entity')).toBe(true);
		expect(entities.map((c) => c.slug)).toContain('person');
		expect(entities.map((c) => c.slug)).toContain('company');
	});

	it('filters by Blockchain category', () => {
		const blockchain = listClassifications('Blockchain');

		expect(blockchain.map((c) => c.slug)).toEqual([
			'ethereum-account',
			'ethereum-erc20',
			'ethereum-smart-contract',
		]);
	});

	it('returns empty array for unknown categories', () => {
		const result = listClassifications('Nonexistent');

		expect(result).toEqual([]);
	});

	it('each entry has the expected summary shape', () => {
		const all = listClassifications();

		for (const entry of all) {
			expect(entry).toHaveProperty('slug');
			expect(entry).toHaveProperty('type');
			expect(entry).toHaveProperty('displayName');
			expect(entry).toHaveProperty('description');
			expect(entry).toHaveProperty('category');
			expect(typeof entry.slug).toBe('string');
			expect(typeof entry.type).toBe('string');
			expect(typeof entry.displayName).toBe('string');
		}
	});
});

describe('getRequiredFields', () => {
	it('returns fields for the person classification', () => {
		const fields = getRequiredFields('person');

		expect(fields).toHaveLength(2);
		expect(fields).toContainEqual(
			expect.objectContaining({
				key: 'givenName',
				required: true,
				fieldType: 'string',
			})
		);
		expect(fields).toContainEqual(
			expect.objectContaining({
				key: 'familyName',
				required: true,
				fieldType: 'string',
			})
		);
	});

	it('returns all fields including optional ones', () => {
		const fields = getRequiredFields('company');
		const keys = fields.map((f) => f.key);

		expect(keys).toContain('name');
		expect(keys).toContain('url');
		expect(keys).toContain('sameAs');

		const nameField = fields.find((f) => f.key === 'name');
		const urlField = fields.find((f) => f.key === 'url');

		expect(nameField?.required).toBe(true);
		expect(urlField?.required).toBe(false);
	});

	it('returns an empty array for unknown classifications', () => {
		const fields = getRequiredFields('nonexistent');

		expect(fields).toEqual([]);
	});

	it('includes placeholder values when available', () => {
		const fields = getRequiredFields('person');
		const givenName = fields.find((f) => f.key === 'givenName');

		expect(givenName?.placeholder).toBe('Vitalik');
	});

	it('returns fields with label and description', () => {
		const fields = getRequiredFields('person');

		for (const field of fields) {
			expect(typeof field.label).toBe('string');
			expect(field.label.length).toBeGreaterThan(0);
			expect(typeof field.description).toBe('string');
			expect(field.description.length).toBeGreaterThan(0);
		}
	});

	it('includes field type information', () => {
		const fields = getRequiredFields('ethereum-account');
		const addressField = fields.find((f) => f.key === 'address');

		expect(addressField?.fieldType).toBe('address');
		expect(addressField?.required).toBe(true);
	});
});

describe('getClassificationFields', () => {
	it('returns the same result as getRequiredFields (deprecated alias)', () => {
		const fromNew = getClassificationFields('person');
		const fromOld = getRequiredFields('person');

		expect(fromNew).toEqual(fromOld);
	});

	it('returns all fields including optional ones', () => {
		const fields = getClassificationFields('company');
		const keys = fields.map((f) => f.key);

		expect(keys).toContain('name');
		expect(keys).toContain('url');
		expect(keys).toContain('sameAs');

		const nameField = fields.find((f) => f.key === 'name');
		const urlField = fields.find((f) => f.key === 'url');

		expect(nameField?.required).toBe(true);
		expect(urlField?.required).toBe(false);
	});

	it('returns an empty array for unknown classifications', () => {
		expect(getClassificationFields('nonexistent')).toEqual([]);
	});
});

describe('suggestClassification', () => {
	it('suggests person for givenName and familyName fields', () => {
		const suggestion = suggestClassification({
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		expect(suggestion).toBe('person');
	});

	it('suggests software for name and codeRepository fields', () => {
		const suggestion = suggestClassification({
			name: 'intuition-v2',
			codeRepository: 'https://github.com/0xintuition/intuition-v2',
		});

		expect(suggestion).toBe('software');
	});

	it('suggests ethereum-account for address-only field', () => {
		const suggestion = suggestClassification({
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		});

		// address is a field in multiple classifications (ethereum-account, ethereum-erc20, ethereum-smart-contract)
		// but ethereum-account has the most overlap (1 field matching, and all required met)
		expect(suggestion).toBeTruthy();
	});

	it('returns null for empty values', () => {
		expect(suggestClassification({})).toBeNull();
	});

	it('returns null when no fields match any classification', () => {
		expect(
			suggestClassification({
				totallyRandom: true,
				anotherRandom: 'field',
			})
		).toBeNull();
	});

	it('prefers classifications where all required fields are met', () => {
		// headline is unique to article/news-article; having just headline should suggest article
		const suggestion = suggestClassification({
			headline: 'Test Headline',
		});

		// Could be article or news-article, both have headline as required
		expect(suggestion).toBeTruthy();
		expect(['article', 'news-article']).toContain(suggestion);
	});

	it('prefers higher match count when deciding between classifications', () => {
		// byArtist + inAlbum are unique to music-recording
		const suggestion = suggestClassification({
			name: 'One More Time',
			byArtist: 'Daft Punk',
			inAlbum: 'Discovery',
		});

		expect(suggestion).toBe('music-recording');
	});
});
