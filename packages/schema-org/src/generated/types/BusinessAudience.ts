import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusinessAudience = {
	id: 'schema:BusinessAudience',
	name: 'BusinessAudience',
	label: 'BusinessAudience',
	comment:
		"A set of characteristics belonging to businesses, e.g. who compose an item's target audience.",
	subClassOf: ['Audience', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:numberOfEmployees',
			name: 'numberOfEmployees',
			label: 'numberOfEmployees',
			comment: 'The number of employees in an organization, e.g. business.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:yearlyRevenue',
			name: 'yearlyRevenue',
			label: 'yearlyRevenue',
			comment: 'The size of the business in annual revenue.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:yearsInOperation',
			name: 'yearsInOperation',
			label: 'yearsInOperation',
			comment: 'The age of the business.',
			rangeIncludes: ['QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusinessAudience;
export const BusinessAudience = schemaOrgBusinessAudience;

export default schemaOrgBusinessAudience;
