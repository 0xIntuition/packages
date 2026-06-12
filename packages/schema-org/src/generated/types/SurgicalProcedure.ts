import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSurgicalProcedure = {
	id: 'schema:SurgicalProcedure',
	name: 'SurgicalProcedure',
	label: 'SurgicalProcedure',
	comment:
		'A medical procedure involving an incision with instruments; performed for diagnose, or therapeutic purposes.',
	subClassOf: ['MedicalProcedure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSurgicalProcedure;
export const SurgicalProcedure = schemaOrgSurgicalProcedure;

export default schemaOrgSurgicalProcedure;
