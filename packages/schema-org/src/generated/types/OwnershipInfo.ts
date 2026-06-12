import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOwnershipInfo = {
	id: 'schema:OwnershipInfo',
	name: 'OwnershipInfo',
	label: 'OwnershipInfo',
	comment:
		'A structured value providing information about when a certain organization or person owned a certain product.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:acquiredFrom',
			name: 'acquiredFrom',
			label: 'acquiredFrom',
			comment: 'The organization or person from which the product was acquired.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:ownedFrom',
			name: 'ownedFrom',
			label: 'ownedFrom',
			comment: 'The date and time of obtaining the product.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:ownedThrough',
			name: 'ownedThrough',
			label: 'ownedThrough',
			comment: 'The date and time of giving up ownership on the product.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:typeOfGood',
			name: 'typeOfGood',
			label: 'typeOfGood',
			comment: 'The product that this structured value is referring to.',
			rangeIncludes: ['Product', 'Service'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOwnershipInfo;
export const OwnershipInfo = schemaOrgOwnershipInfo;

export default schemaOrgOwnershipInfo;
