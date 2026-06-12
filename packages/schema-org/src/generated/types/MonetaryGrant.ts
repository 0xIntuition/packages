import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMonetaryGrant = {
	id: 'schema:MonetaryGrant',
	name: 'MonetaryGrant',
	label: 'MonetaryGrant',
	comment: 'A monetary grant.',
	subClassOf: ['Grant', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:amount',
			name: 'amount',
			label: 'amount',
			comment: 'The amount of money.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
		{
			id: 'schema:funder',
			name: 'funder',
			label: 'funder',
			comment:
				'A person or organization that supports (sponsors) something through some kind of financial contribution.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMonetaryGrant;
export const MonetaryGrant = schemaOrgMonetaryGrant;

export default schemaOrgMonetaryGrant;
