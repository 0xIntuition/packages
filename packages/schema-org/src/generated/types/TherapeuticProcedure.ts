import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTherapeuticProcedure = {
	id: 'schema:TherapeuticProcedure',
	name: 'TherapeuticProcedure',
	label: 'TherapeuticProcedure',
	comment:
		'A medical procedure intended primarily for therapeutic purposes, aimed at improving a health condition.',
	subClassOf: ['MedicalProcedure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:adverseOutcome',
			name: 'adverseOutcome',
			label: 'adverseOutcome',
			comment:
				'A possible complication and/or side effect of this therapy. If it is known that an adverse outcome is serious (resulting in death, disability, or permanent damage; requiring hospitalization; or otherwise life-threatening or requiring immediate medical attention), tag it as a seriousAdverseOutcome instead.',
			rangeIncludes: ['MedicalEntity'],
		},
		{
			id: 'schema:doseSchedule',
			name: 'doseSchedule',
			label: 'doseSchedule',
			comment:
				'A dosing schedule for the drug for a given population, either observed, recommended, or maximum dose based on the type used.',
			rangeIncludes: ['DoseSchedule'],
		},
		{
			id: 'schema:drug',
			name: 'drug',
			label: 'drug',
			comment: 'Specifying a drug or medicine used in a medication procedure.',
			rangeIncludes: ['Drug'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTherapeuticProcedure;
export const TherapeuticProcedure = schemaOrgTherapeuticProcedure;

export default schemaOrgTherapeuticProcedure;
