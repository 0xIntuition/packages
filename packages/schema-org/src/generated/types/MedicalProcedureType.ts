import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalProcedureType = {
	id: 'schema:MedicalProcedureType',
	name: 'MedicalProcedureType',
	label: 'MedicalProcedureType',
	comment: 'An enumeration that describes different types of medical procedures.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalProcedureType;
export const MedicalProcedureType = schemaOrgMedicalProcedureType;

export default schemaOrgMedicalProcedureType;
