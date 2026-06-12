import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalProcedure = {
	id: 'schema:MedicalProcedure',
	name: 'MedicalProcedure',
	label: 'MedicalProcedure',
	comment:
		'A process of care used in either a diagnostic, therapeutic, preventive or palliative capacity that relies on invasive (surgical), non-invasive, or other techniques.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:bodyLocation',
			name: 'bodyLocation',
			label: 'bodyLocation',
			comment: 'Location in the body of the anatomical structure.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:followup',
			name: 'followup',
			label: 'followup',
			comment: 'Typical or recommended followup care after the procedure is performed.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:howPerformed',
			name: 'howPerformed',
			label: 'howPerformed',
			comment: 'How the procedure is performed.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:preparation',
			name: 'preparation',
			label: 'preparation',
			comment:
				'Typical preparation that a patient must undergo before having the procedure performed.',
			rangeIncludes: ['MedicalEntity', 'Text'],
		},
		{
			id: 'schema:procedureType',
			name: 'procedureType',
			label: 'procedureType',
			comment: 'The type of procedure, for example Surgical, Noninvasive, or Percutaneous.',
			rangeIncludes: ['MedicalProcedureType'],
		},
		{
			id: 'schema:status',
			name: 'status',
			label: 'status',
			comment: 'The status of the study (enumerated).',
			rangeIncludes: ['EventStatusType', 'MedicalStudyStatus', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalProcedure;
export const MedicalProcedure = schemaOrgMedicalProcedure;

export default schemaOrgMedicalProcedure;
