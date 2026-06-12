import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDiagnosticLab = {
	id: 'schema:DiagnosticLab',
	name: 'DiagnosticLab',
	label: 'DiagnosticLab',
	comment: 'A medical laboratory that offers on-site or off-site diagnostic services.',
	subClassOf: ['MedicalOrganization', 'Organization', 'Thing'],
	properties: [
		{
			id: 'schema:availableTest',
			name: 'availableTest',
			label: 'availableTest',
			comment: 'A diagnostic test or procedure offered by this lab.',
			rangeIncludes: ['MedicalTest'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDiagnosticLab;
export const DiagnosticLab = schemaOrgDiagnosticLab;

export default schemaOrgDiagnosticLab;
