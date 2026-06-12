import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWarrantyPromise = {
	id: 'schema:WarrantyPromise',
	name: 'WarrantyPromise',
	label: 'WarrantyPromise',
	comment:
		'A structured value representing the duration and scope of services that will be provided to a customer free of charge in case of a defect or malfunction of a product.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:durationOfWarranty',
			name: 'durationOfWarranty',
			label: 'durationOfWarranty',
			comment:
				'The duration of the warranty promise. Common unitCode values are ANN for year, MON for months, or DAY for days.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:warrantyScope',
			name: 'warrantyScope',
			label: 'warrantyScope',
			comment: 'The scope of the warranty promise.',
			rangeIncludes: ['WarrantyScope'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWarrantyPromise;
export const WarrantyPromise = schemaOrgWarrantyPromise;

export default schemaOrgWarrantyPromise;
