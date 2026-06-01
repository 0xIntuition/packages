import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSearchRescueOrganization = {
	id: 'schema:SearchRescueOrganization',
	name: 'SearchRescueOrganization',
	label: 'SearchRescueOrganization',
	comment: 'A Search and Rescue organization of some kind.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSearchRescueOrganization;
export const SearchRescueOrganization = schemaOrgSearchRescueOrganization;

export default schemaOrgSearchRescueOrganization;
