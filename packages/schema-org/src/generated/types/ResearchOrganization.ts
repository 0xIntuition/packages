import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResearchOrganization = {
	id: 'schema:ResearchOrganization',
	name: 'ResearchOrganization',
	label: 'ResearchOrganization',
	comment: 'A Research Organization (e.g. scientific institute, research company).',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResearchOrganization;
export const ResearchOrganization = schemaOrgResearchOrganization;

export default schemaOrgResearchOrganization;
