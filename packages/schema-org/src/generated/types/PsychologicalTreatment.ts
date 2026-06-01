import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPsychologicalTreatment = {
	id: 'schema:PsychologicalTreatment',
	name: 'PsychologicalTreatment',
	label: 'PsychologicalTreatment',
	comment:
		'A process of care relying upon counseling, dialogue and communication  aimed at improving a mental health condition without use of drugs.',
	subClassOf: ['TherapeuticProcedure', 'MedicalProcedure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPsychologicalTreatment;
export const PsychologicalTreatment = schemaOrgPsychologicalTreatment;

export default schemaOrgPsychologicalTreatment;
