import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDoseSchedule = {
	id: 'schema:DoseSchedule',
	name: 'DoseSchedule',
	label: 'DoseSchedule',
	comment: 'A specific dosing schedule for a drug or supplement.',
	subClassOf: ['MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:doseUnit',
			name: 'doseUnit',
			label: 'doseUnit',
			comment: "The unit of the dose, e.g. 'mg'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:doseValue',
			name: 'doseValue',
			label: 'doseValue',
			comment: 'The value of the dose, e.g. 500.',
			rangeIncludes: ['Number', 'QualitativeValue'],
		},
		{
			id: 'schema:frequency',
			name: 'frequency',
			label: 'frequency',
			comment: "How often the dose is taken, e.g. 'daily'.",
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

export const spec = schemaOrgDoseSchedule;
export const DoseSchedule = schemaOrgDoseSchedule;

export default schemaOrgDoseSchedule;
