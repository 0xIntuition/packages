import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSportsOrganization = {
	id: 'schema:SportsOrganization',
	name: 'SportsOrganization',
	label: 'SportsOrganization',
	comment:
		'Represents the collection of all sports organizations, including sports teams, governing bodies, and sports associations.',
	subClassOf: ['Organization', 'Thing'],
	properties: [
		{
			id: 'schema:sport',
			name: 'sport',
			label: 'sport',
			comment: 'A type of sport (e.g. Baseball).',
			rangeIncludes: ['Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSportsOrganization;
export const SportsOrganization = schemaOrgSportsOrganization;

export default schemaOrgSportsOrganization;
