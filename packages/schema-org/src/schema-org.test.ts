import { describe, expect, it } from 'vitest';
import { schemaOrg3DModel } from './generated/types/3DModel.js';
import { schemaOrgText } from './generated/types/Text.js';
import {
	getPropertiesFor,
	getType,
	SCHEMA_ORG_GENERATED_TYPE_COUNT,
	SCHEMA_ORG_SOURCE_URL,
} from './index.js';

describe('schema.org generated vocabulary', () => {
	it('records the pinned schema.org source', () => {
		expect(SCHEMA_ORG_SOURCE_URL).toBe(
			'https://schema.org/version/30.0/schemaorg-current-https.jsonld'
		);
		expect(SCHEMA_ORG_GENERATED_TYPE_COUNT).toBeGreaterThan(900);
	});

	it('resolves inherited Book properties with originating type provenance', () => {
		const book = getType('Book');
		expect(book?.subClassOf).toEqual(expect.arrayContaining(['CreativeWork', 'Thing']));
		expect(book?.properties.map((property) => property.name)).not.toContain('name');
		expect(book?.properties.map((property) => property.name)).not.toContain('author');

		const properties = getPropertiesFor('Book');
		const name = properties.find((property) => property.name === 'name');
		const author = properties.find((property) => property.name === 'author');

		expect(name).toMatchObject({
			id: 'schema:name',
			label: 'name',
			originType: 'Thing',
			originTypeId: 'schema:Thing',
			rangeIncludes: ['Text'],
		});
		expect(author).toMatchObject({
			id: 'schema:author',
			label: 'author',
			originType: 'CreativeWork',
			originTypeId: 'schema:CreativeWork',
			rangeIncludes: ['Organization', 'Person'],
		});
	});

	it('resolves multi-inheritance chains nearest parents first', () => {
		const localBusiness = getType('LocalBusiness');

		expect(localBusiness?.subClassOf).toEqual(['Organization', 'Place', 'Thing']);
		expect(localBusiness?.properties.map((property) => property.name)).toContain('branchOf');
	});

	it('includes schema.org data types as vocabulary nodes', () => {
		expect(schemaOrgText).toMatchObject({
			id: 'schema:Text',
			name: 'Text',
			properties: [],
			subClassOf: [],
		});
		expect(getPropertiesFor('Text')).toEqual([]);
	});

	it('keeps identifier-unsafe type names available through safe exports', () => {
		expect(schemaOrg3DModel).toMatchObject({
			id: 'schema:3DModel',
			name: '3DModel',
		});
		expect(getType('3DModel')).toBe(schemaOrg3DModel);
	});

	it('resolves types by schema id and full schema.org URL', () => {
		expect(getType('schema:Book')?.name).toBe('Book');
		expect(getType('https://schema.org/Book')?.name).toBe('Book');
	});
});
