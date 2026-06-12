import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDietarySupplement = {
	id: 'schema:DietarySupplement',
	name: 'DietarySupplement',
	label: 'DietarySupplement',
	comment:
		'A product taken by mouth that contains a dietary ingredient intended to supplement the diet. Dietary ingredients may include vitamins, minerals, herbs or other botanicals, amino acids, and substances such as enzymes, organ tissues, glandulars and metabolites.',
	subClassOf: ['Product', 'Substance', 'Thing', 'MedicalEntity'],
	properties: [
		{
			id: 'schema:activeIngredient',
			name: 'activeIngredient',
			label: 'activeIngredient',
			comment: 'An active ingredient, typically chemical compounds and/or biologic substances.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:isProprietary',
			name: 'isProprietary',
			label: 'isProprietary',
			comment: "True if this item's name is a proprietary/brand name (vs. generic name).",
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:legalStatus',
			name: 'legalStatus',
			label: 'legalStatus',
			comment:
				"The drug or supplement's legal status, including any controlled substance schedules that apply.",
			rangeIncludes: ['DrugLegalStatus', 'MedicalEnumeration', 'Text'],
		},
		{
			id: 'schema:maximumIntake',
			name: 'maximumIntake',
			label: 'maximumIntake',
			comment:
				'Recommended intake of this supplement for a given population as defined by a specific recommending authority.',
			rangeIncludes: ['MaximumDoseSchedule'],
		},
		{
			id: 'schema:mechanismOfAction',
			name: 'mechanismOfAction',
			label: 'mechanismOfAction',
			comment:
				'The specific biochemical interaction through which this drug or supplement produces its pharmacological effect.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:nonProprietaryName',
			name: 'nonProprietaryName',
			label: 'nonProprietaryName',
			comment: 'The generic name of this drug or supplement.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:proprietaryName',
			name: 'proprietaryName',
			label: 'proprietaryName',
			comment: 'Proprietary name given to the diet plan, typically by its originator or creator.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:recommendedIntake',
			name: 'recommendedIntake',
			label: 'recommendedIntake',
			comment:
				'Recommended intake of this supplement for a given population as defined by a specific recommending authority.',
			rangeIncludes: ['RecommendedDoseSchedule'],
		},
		{
			id: 'schema:safetyConsideration',
			name: 'safetyConsideration',
			label: 'safetyConsideration',
			comment:
				'Any potential safety concern associated with the supplement. May include interactions with other drugs and foods, pregnancy, breastfeeding, known adverse reactions, and documented efficacy of the supplement.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:targetPopulation',
			name: 'targetPopulation',
			label: 'targetPopulation',
			comment:
				"Characteristics of the population for which this is intended, or which typically uses it, e.g. 'adults'.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDietarySupplement;
export const DietarySupplement = schemaOrgDietarySupplement;

export default schemaOrgDietarySupplement;
