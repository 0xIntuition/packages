import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSportsEvent = {
	id: 'schema:SportsEvent',
	name: 'SportsEvent',
	label: 'SportsEvent',
	comment: 'Event type: Sports event.',
	subClassOf: ['Event', 'Thing'],
	properties: [
		{
			id: 'schema:awayTeam',
			name: 'awayTeam',
			label: 'awayTeam',
			comment: 'The away team in a sports event.',
			rangeIncludes: ['Person', 'SportsTeam'],
		},
		{
			id: 'schema:competitor',
			name: 'competitor',
			label: 'competitor',
			comment: 'A competitor in a sports event.',
			rangeIncludes: ['Person', 'SportsTeam'],
		},
		{
			id: 'schema:homeTeam',
			name: 'homeTeam',
			label: 'homeTeam',
			comment: 'The home team in a sports event.',
			rangeIncludes: ['Person', 'SportsTeam'],
		},
		{
			id: 'schema:referee',
			name: 'referee',
			label: 'referee',
			comment:
				'An official who watches a game or match closely to enforce the rules and arbitrate on matters arising from the play such as referees, umpires or judges. The name of the effective function can vary according to the sport.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:sport',
			name: 'sport',
			label: 'sport',
			comment: 'A type of sport (e.g. Baseball).',
			rangeIncludes: ['Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSportsEvent;
export const SportsEvent = schemaOrgSportsEvent;

export default schemaOrgSportsEvent;
