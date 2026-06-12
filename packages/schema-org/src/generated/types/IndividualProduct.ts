import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIndividualProduct = {
	id: 'schema:IndividualProduct',
	name: 'IndividualProduct',
	label: 'IndividualProduct',
	comment:
		'A single, identifiable product instance (e.g. a laptop with a particular serial number).',
	subClassOf: ['Product', 'Thing'],
	properties: [
		{
			id: 'schema:serialNumber',
			name: 'serialNumber',
			label: 'serialNumber',
			comment:
				'The serial number or any alphanumeric identifier of a particular product. When attached to an offer, it is a shortcut for the serial number of the product included in the offer.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIndividualProduct;
export const IndividualProduct = schemaOrgIndividualProduct;

export default schemaOrgIndividualProduct;
