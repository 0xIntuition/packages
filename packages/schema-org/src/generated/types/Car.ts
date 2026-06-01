import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCar = {
	id: 'schema:Car',
	name: 'Car',
	label: 'Car',
	comment: 'A car is a wheeled, self-powered motor vehicle used for transportation.',
	subClassOf: ['Vehicle', 'Product', 'Thing'],
	properties: [
		{
			id: 'schema:acrissCode',
			name: 'acrissCode',
			label: 'acrissCode',
			comment:
				'The ACRISS Car Classification Code is a code used by many car rental companies, for classifying vehicles. ACRISS stands for Association of Car Rental Industry Systems and Standards.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:roofLoad',
			name: 'roofLoad',
			label: 'roofLoad',
			comment:
				'The permitted total weight of cargo and installations (e.g. a roof rack) on top of the vehicle.\\n\\nTypical unit code(s): KGM for kilogram, LBR for pound\\n\\n* Note 1: You can indicate additional information in the [[name]] of the [[QuantitativeValue]] node.\\n* Note 2: You may also link to a [[QualitativeValue]] node that provides additional information using [[valueReference]]\\n* Note 3: Note that you can use [[minValue]] and [[maxValue]] to indicate ranges.',
			rangeIncludes: ['QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCar;
export const Car = schemaOrgCar;

export default schemaOrgCar;
