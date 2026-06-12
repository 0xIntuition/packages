import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSubstance = {
	id: 'schema:Substance',
	name: 'Substance',
	label: 'Substance',
	comment:
		'Any matter of defined composition that has discrete existence, whose origin may be biological, mineral or chemical.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:activeIngredient',
			name: 'activeIngredient',
			label: 'activeIngredient',
			comment: 'An active ingredient, typically chemical compounds and/or biologic substances.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:maximumIntake',
			name: 'maximumIntake',
			label: 'maximumIntake',
			comment:
				'Recommended intake of this supplement for a given population as defined by a specific recommending authority.',
			rangeIncludes: ['MaximumDoseSchedule'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSubstance;
export const Substance = schemaOrgSubstance;

export default schemaOrgSubstance;
