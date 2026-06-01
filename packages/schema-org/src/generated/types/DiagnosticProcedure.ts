import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDiagnosticProcedure = {
	id: 'schema:DiagnosticProcedure',
	name: 'DiagnosticProcedure',
	label: 'DiagnosticProcedure',
	comment:
		'A medical procedure intended primarily for diagnostic, as opposed to therapeutic, purposes.',
	subClassOf: ['MedicalProcedure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDiagnosticProcedure;
export const DiagnosticProcedure = schemaOrgDiagnosticProcedure;

export default schemaOrgDiagnosticProcedure;
