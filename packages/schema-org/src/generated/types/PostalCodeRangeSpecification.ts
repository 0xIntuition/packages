import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPostalCodeRangeSpecification = {
	id: 'schema:PostalCodeRangeSpecification',
	name: 'PostalCodeRangeSpecification',
	label: 'PostalCodeRangeSpecification',
	comment:
		'Indicates a range of postal codes, usually defined as the set of valid codes between [[postalCodeBegin]] and [[postalCodeEnd]], inclusively.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:postalCodeBegin',
			name: 'postalCodeBegin',
			label: 'postalCodeBegin',
			comment: 'First postal code in a range (included).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:postalCodeEnd',
			name: 'postalCodeEnd',
			label: 'postalCodeEnd',
			comment: 'Last postal code in the range (included). Needs to be after [[postalCodeBegin]].',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPostalCodeRangeSpecification;
export const PostalCodeRangeSpecification = schemaOrgPostalCodeRangeSpecification;

export default schemaOrgPostalCodeRangeSpecification;
