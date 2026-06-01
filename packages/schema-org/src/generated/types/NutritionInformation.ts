import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNutritionInformation = {
	id: 'schema:NutritionInformation',
	name: 'NutritionInformation',
	label: 'NutritionInformation',
	comment: 'Nutritional information about the recipe.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:calories',
			name: 'calories',
			label: 'calories',
			comment: 'The number of calories.',
			rangeIncludes: ['Energy'],
		},
		{
			id: 'schema:carbohydrateContent',
			name: 'carbohydrateContent',
			label: 'carbohydrateContent',
			comment: 'The number of grams of carbohydrates.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:cholesterolContent',
			name: 'cholesterolContent',
			label: 'cholesterolContent',
			comment: 'The number of milligrams of cholesterol.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:fatContent',
			name: 'fatContent',
			label: 'fatContent',
			comment: 'The number of grams of fat.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:fiberContent',
			name: 'fiberContent',
			label: 'fiberContent',
			comment: 'The number of grams of fiber.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:proteinContent',
			name: 'proteinContent',
			label: 'proteinContent',
			comment: 'The number of grams of protein.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:saturatedFatContent',
			name: 'saturatedFatContent',
			label: 'saturatedFatContent',
			comment: 'The number of grams of saturated fat.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:servingSize',
			name: 'servingSize',
			label: 'servingSize',
			comment: 'The serving size, in terms of the number of volume or mass.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:sodiumContent',
			name: 'sodiumContent',
			label: 'sodiumContent',
			comment: 'The number of milligrams of sodium.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:sugarContent',
			name: 'sugarContent',
			label: 'sugarContent',
			comment: 'The number of grams of sugar.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:transFatContent',
			name: 'transFatContent',
			label: 'transFatContent',
			comment: 'The number of grams of trans fat.',
			rangeIncludes: ['Mass'],
		},
		{
			id: 'schema:unsaturatedFatContent',
			name: 'unsaturatedFatContent',
			label: 'unsaturatedFatContent',
			comment: 'The number of grams of unsaturated fat.',
			rangeIncludes: ['Mass'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNutritionInformation;
export const NutritionInformation = schemaOrgNutritionInformation;

export default schemaOrgNutritionInformation;
