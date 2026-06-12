import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalIndication = {
	id: 'schema:MedicalIndication',
	name: 'MedicalIndication',
	label: 'MedicalIndication',
	comment:
		'A condition or factor that indicates use of a medical therapy, including signs, symptoms, risk factors, anatomical states, etc.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalIndication;
export const MedicalIndication = schemaOrgMedicalIndication;

export default schemaOrgMedicalIndication;
