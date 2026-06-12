import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalGuidelineRecommendation = {
	id: 'schema:MedicalGuidelineRecommendation',
	name: 'MedicalGuidelineRecommendation',
	label: 'MedicalGuidelineRecommendation',
	comment:
		'A guideline recommendation that is regarded as efficacious and where quality of the data supporting the recommendation is sound.',
	subClassOf: ['MedicalGuideline', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:recommendationStrength',
			name: 'recommendationStrength',
			label: 'recommendationStrength',
			comment: "Strength of the guideline's recommendation (e.g. 'class I').",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalGuidelineRecommendation;
export const MedicalGuidelineRecommendation = schemaOrgMedicalGuidelineRecommendation;

export default schemaOrgMedicalGuidelineRecommendation;
