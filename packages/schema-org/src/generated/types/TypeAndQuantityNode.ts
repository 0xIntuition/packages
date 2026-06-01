import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTypeAndQuantityNode = {
	id: 'schema:TypeAndQuantityNode',
	name: 'TypeAndQuantityNode',
	label: 'TypeAndQuantityNode',
	comment:
		'A structured value indicating the quantity, unit of measurement, and business function of goods included in a bundle offer.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:amountOfThisGood',
			name: 'amountOfThisGood',
			label: 'amountOfThisGood',
			comment: 'The quantity of the goods included in the offer.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:businessFunction',
			name: 'businessFunction',
			label: 'businessFunction',
			comment:
				'The business function (e.g. sell, lease, repair, dispose) of the offer or component of a bundle (TypeAndQuantityNode). The default is http://purl.org/goodrelations/v1#Sell.',
			rangeIncludes: ['BusinessFunction'],
		},
		{
			id: 'schema:typeOfGood',
			name: 'typeOfGood',
			label: 'typeOfGood',
			comment: 'The product that this structured value is referring to.',
			rangeIncludes: ['Product', 'Service'],
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
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTypeAndQuantityNode;
export const TypeAndQuantityNode = schemaOrgTypeAndQuantityNode;

export default schemaOrgTypeAndQuantityNode;
