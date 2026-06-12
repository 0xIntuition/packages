import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrganizationRole = {
	id: 'schema:OrganizationRole',
	name: 'OrganizationRole',
	label: 'OrganizationRole',
	comment: 'A subclass of Role used to describe roles within organizations.',
	subClassOf: ['Role', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:numberedPosition',
			name: 'numberedPosition',
			label: 'numberedPosition',
			comment:
				"A number associated with a role in an organization, for example, the number on an athlete's jersey.",
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrganizationRole;
export const OrganizationRole = schemaOrgOrganizationRole;

export default schemaOrgOrganizationRole;
