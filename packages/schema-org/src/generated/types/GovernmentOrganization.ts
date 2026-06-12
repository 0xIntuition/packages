import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGovernmentOrganization = {
	id: 'schema:GovernmentOrganization',
	name: 'GovernmentOrganization',
	label: 'GovernmentOrganization',
	comment: 'A governmental organization or agency.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGovernmentOrganization;
export const GovernmentOrganization = schemaOrgGovernmentOrganization;

export default schemaOrgGovernmentOrganization;
