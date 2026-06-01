import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPreventionIndication = {
	id: 'schema:PreventionIndication',
	name: 'PreventionIndication',
	label: 'PreventionIndication',
	comment: 'An indication for preventing an underlying condition, symptom, etc.',
	subClassOf: ['MedicalIndication', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPreventionIndication;
export const PreventionIndication = schemaOrgPreventionIndication;

export default schemaOrgPreventionIndication;
