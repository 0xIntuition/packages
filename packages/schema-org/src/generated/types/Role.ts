import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRole = {
	id: 'schema:Role',
	name: 'Role',
	label: 'Role',
	comment:
		"Represents additional information about a relationship or property. For example a Role can be used to say that a 'member' role linking some SportsTeam to a player occurred during a particular time period. Or that a Person's 'actor' role in a Movie was for some particular characterName. Such properties can be attached to a Role entity, which is then associated with the main entities using ordinary properties like 'member' or 'actor'.\\n\\nSee also [blog post](https://blog.schema.org/2014/06/16/introducing-role/).",
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:namedPosition',
			name: 'namedPosition',
			label: 'namedPosition',
			comment:
				"A position played, performed or filled by a person or organization, as part of an organization. For example, an athlete in a SportsTeam might play in the position named 'Quarterback'.",
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:roleName',
			name: 'roleName',
			label: 'roleName',
			comment:
				"A role played, performed or filled by a person or organization. For example, the team of creators for a comic book might fill the roles named 'inker', 'penciller', and 'letterer'; or an athlete in a SportsTeam might play in the position named 'Quarterback'.",
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRole;
export const Role = schemaOrgRole;

export default schemaOrgRole;
