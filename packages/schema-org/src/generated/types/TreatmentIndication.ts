import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTreatmentIndication = {
	id: 'schema:TreatmentIndication',
	name: 'TreatmentIndication',
	label: 'TreatmentIndication',
	comment: 'An indication for treating an underlying condition, symptom, etc.',
	subClassOf: ['MedicalIndication', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTreatmentIndication;
export const TreatmentIndication = schemaOrgTreatmentIndication;

export default schemaOrgTreatmentIndication;
