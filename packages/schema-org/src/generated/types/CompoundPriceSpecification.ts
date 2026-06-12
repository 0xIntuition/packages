import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCompoundPriceSpecification = {
	id: 'schema:CompoundPriceSpecification',
	name: 'CompoundPriceSpecification',
	label: 'CompoundPriceSpecification',
	comment:
		'A compound price specification is one that bundles multiple prices that all apply in combination for different dimensions of consumption. Use the name property of the attached unit price specification for indicating the dimension of a price component (e.g. "electricity" or "final cleaning").',
	subClassOf: ['PriceSpecification', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:priceComponent',
			name: 'priceComponent',
			label: 'priceComponent',
			comment:
				'This property links to all [[UnitPriceSpecification]] nodes that apply in parallel for the [[CompoundPriceSpecification]] node.',
			rangeIncludes: ['PriceSpecification'],
		},
		{
			id: 'schema:priceType',
			name: 'priceType',
			label: 'priceType',
			comment:
				'Defines the type of a price specified for an offered product, for example a list price, a (temporary) sale price or a manufacturer suggested retail price. If multiple prices are specified for an offer the [[priceType]] property can be used to identify the type of each such specified price. The value of priceType can be specified as a value from enumeration PriceTypeEnumeration or, a UN/EDIFACT 5387 code, or as a free form text string for price types that are not already predefined in PriceTypeEnumeration.',
			rangeIncludes: ['PriceTypeEnumeration', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCompoundPriceSpecification;
export const CompoundPriceSpecification = schemaOrgCompoundPriceSpecification;

export default schemaOrgCompoundPriceSpecification;
