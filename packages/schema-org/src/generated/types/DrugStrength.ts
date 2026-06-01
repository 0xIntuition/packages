import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugStrength = {
	id: 'schema:DrugStrength',
	name: 'DrugStrength',
	label: 'DrugStrength',
	comment: 'A specific strength in which a medical drug is available in a specific country.',
	subClassOf: ['MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:activeIngredient',
			name: 'activeIngredient',
			label: 'activeIngredient',
			comment: 'An active ingredient, typically chemical compounds and/or biologic substances.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:availableIn',
			name: 'availableIn',
			label: 'availableIn',
			comment: 'The location in which the strength is available.',
			rangeIncludes: ['AdministrativeArea'],
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
			id: 'schema:strengthUnit',
			name: 'strengthUnit',
			label: 'strengthUnit',
			comment: "The units of an active ingredient's strength, e.g. mg.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:strengthValue',
			name: 'strengthValue',
			label: 'strengthValue',
			comment: "The value of an active ingredient's strength, e.g. 325.",
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugStrength;
export const DrugStrength = schemaOrgDrugStrength;

export default schemaOrgDrugStrength;
