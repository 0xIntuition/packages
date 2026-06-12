import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQualitativeValue = {
	id: 'schema:QualitativeValue',
	name: 'QualitativeValue',
	label: 'QualitativeValue',
	comment:
		"A predefined value for a product characteristic, e.g. the power cord plug type 'US' or the garment sizes 'S', 'M', 'L', and 'XL'.",
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:additionalProperty',
			name: 'additionalProperty',
			label: 'additionalProperty',
			comment:
				'A property-value pair representing an additional characteristic of the entity, e.g. a product feature or another characteristic for which there is no matching property in schema.org.\\n\\nNote: Publishers should be aware that applications designed to use specific schema.org properties (e.g. https://schema.org/width, https://schema.org/color, https://schema.org/gtin13, ...) will typically expect such data to be provided using those properties, rather than using the generic property/value mechanism.\n',
			rangeIncludes: ['PropertyValue'],
		},
		{
			id: 'schema:equal',
			name: 'equal',
			label: 'equal',
			comment:
				'This ordering relation for qualitative values indicates that the subject is equal to the object.',
			rangeIncludes: ['QualitativeValue'],
		},
		{
			id: 'schema:greater',
			name: 'greater',
			label: 'greater',
			comment:
				'This ordering relation for qualitative values indicates that the subject is greater than the object.',
			rangeIncludes: ['QualitativeValue'],
		},
		{
			id: 'schema:greaterOrEqual',
			name: 'greaterOrEqual',
			label: 'greaterOrEqual',
			comment:
				'This ordering relation for qualitative values indicates that the subject is greater than or equal to the object.',
			rangeIncludes: ['QualitativeValue'],
		},
		{
			id: 'schema:lesser',
			name: 'lesser',
			label: 'lesser',
			comment:
				'This ordering relation for qualitative values indicates that the subject is lesser than the object.',
			rangeIncludes: ['QualitativeValue'],
		},
		{
			id: 'schema:lesserOrEqual',
			name: 'lesserOrEqual',
			label: 'lesserOrEqual',
			comment:
				'This ordering relation for qualitative values indicates that the subject is lesser than or equal to the object.',
			rangeIncludes: ['QualitativeValue'],
		},
		{
			id: 'schema:nonEqual',
			name: 'nonEqual',
			label: 'nonEqual',
			comment:
				'This ordering relation for qualitative values indicates that the subject is not equal to the object.',
			rangeIncludes: ['QualitativeValue'],
		},
		{
			id: 'schema:valueReference',
			name: 'valueReference',
			label: 'valueReference',
			comment:
				'A secondary value that provides additional information on the original value, e.g. a reference temperature or a type of measurement.',
			rangeIncludes: [
				'DefinedTerm',
				'Enumeration',
				'MeasurementTypeEnumeration',
				'PropertyValue',
				'QualitativeValue',
				'QuantitativeValue',
				'StructuredValue',
				'Text',
			],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQualitativeValue;
export const QualitativeValue = schemaOrgQualitativeValue;

export default schemaOrgQualitativeValue;
