import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSportsTeam = {
	id: 'schema:SportsTeam',
	name: 'SportsTeam',
	label: 'SportsTeam',
	comment: 'Organization: Sports team.',
	subClassOf: ['SportsOrganization', 'Organization', 'Thing'],
	properties: [
		{
			id: 'schema:athlete',
			name: 'athlete',
			label: 'athlete',
			comment:
				'A person that acts as performing member of a sports team; a player as opposed to a coach.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:coach',
			name: 'coach',
			label: 'coach',
			comment: 'A person that acts in a coaching role for a sports team.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:gender',
			name: 'gender',
			label: 'gender',
			comment:
				'Gender of something, typically a [[Person]], but possibly also fictional characters, animals, etc. While https://schema.org/Male and https://schema.org/Female may be used, text strings are also acceptable for people who are not a binary gender. The [[gender]] property can also be used in an extended sense to cover e.g. the gender of sports teams. As with the gender of individuals, we do not try to enumerate all possibilities. A mixed-gender [[SportsTeam]] can be indicated with a text value of "Mixed".',
			rangeIncludes: ['GenderType', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSportsTeam;
export const SportsTeam = schemaOrgSportsTeam;

export default schemaOrgSportsTeam;
