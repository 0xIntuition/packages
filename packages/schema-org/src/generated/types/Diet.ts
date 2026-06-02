import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDiet = {
	id: 'schema:Diet',
	name: 'Diet',
	label: 'Diet',
	comment:
		'A strategy of regulating the intake of food to achieve or maintain a specific health-related goal.',
	subClassOf: ['CreativeWork', 'LifestyleModification', 'Thing', 'MedicalEntity'],
	properties: [
		{
			id: 'schema:dietFeatures',
			name: 'dietFeatures',
			label: 'dietFeatures',
			comment:
				"Nutritional information specific to the dietary plan. May include dietary recommendations on what foods to avoid, what foods to consume, and specific alterations/deviations from the USDA or other regulatory body's approved dietary guidelines.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:endorsers',
			name: 'endorsers',
			label: 'endorsers',
			comment: 'People or organizations that endorse the plan.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:expertConsiderations',
			name: 'expertConsiderations',
			label: 'expertConsiderations',
			comment: 'Medical expert advice related to the plan.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:physiologicalBenefits',
			name: 'physiologicalBenefits',
			label: 'physiologicalBenefits',
			comment: 'Specific physiologic benefits associated to the plan.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:risks',
			name: 'risks',
			label: 'risks',
			comment: 'Specific physiologic risks associated to the diet plan.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDiet;
export const Diet = schemaOrgDiet;

export default schemaOrgDiet;
