import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuantitativeValue = {
	id: 'schema:QuantitativeValue',
	name: 'QuantitativeValue',
	label: 'QuantitativeValue',
	comment: ' A point value or interval for product characteristics and other purposes.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
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
			id: 'schema:maxValue',
			name: 'maxValue',
			label: 'maxValue',
			comment: 'The upper value of some characteristic or property.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:minValue',
			name: 'minValue',
			label: 'minValue',
			comment: 'The lower value of some characteristic or property.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:unitCode',
			name: 'unitCode',
			label: 'unitCode',
			comment:
				'The unit of measurement given using the UN/CEFACT Common Code (3 characters) or a URL. Other codes than the UN/CEFACT Common Code may be used with a prefix followed by a colon.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:unitText',
			name: 'unitText',
			label: 'unitText',
			comment:
				"A string or text indicating the unit of measurement. Useful if you cannot provide a standard unit code for\n<a href='unitCode'>unitCode</a>.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:value',
			name: 'value',
			label: 'value',
			comment:
				"The value of a [[QuantitativeValue]] (including [[Observation]]) or property value node.\\n\\n* For [[QuantitativeValue]] and [[MonetaryAmount]], the recommended type for values is 'Number'.\\n* For [[PropertyValue]], it can be 'Text', 'Number', 'Boolean', or 'StructuredValue'.\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
			rangeIncludes: ['Boolean', 'Number', 'StructuredValue', 'Text'],
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

export const spec = schemaOrgQuantitativeValue;
export const QuantitativeValue = schemaOrgQuantitativeValue;

export default schemaOrgQuantitativeValue;
