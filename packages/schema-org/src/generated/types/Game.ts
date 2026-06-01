import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGame = {
	id: 'schema:Game',
	name: 'Game',
	label: 'Game',
	comment:
		'The Game type represents things which are games. These are typically rule-governed recreational activities, e.g. role-playing games in which players assume the role of characters in a fictional setting.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:characterAttribute',
			name: 'characterAttribute',
			label: 'characterAttribute',
			comment:
				'A piece of data that represents a particular aspect of a fictional character (skill, power, character points, advantage, disadvantage).',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:gameItem',
			name: 'gameItem',
			label: 'gameItem',
			comment:
				'An item is an object within the game world that can be collected by a player or, occasionally, a non-player character.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:gameLocation',
			name: 'gameLocation',
			label: 'gameLocation',
			comment: 'Real or fictional location of the game (or part of game).',
			rangeIncludes: ['Place', 'PostalAddress', 'URL'],
		},
		{
			id: 'schema:numberOfPlayers',
			name: 'numberOfPlayers',
			label: 'numberOfPlayers',
			comment: 'Indicate how many people can play this game (minimum, maximum, or range).',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:quest',
			name: 'quest',
			label: 'quest',
			comment:
				'The task that a player-controlled character, or group of characters may complete in order to gain a reward.',
			rangeIncludes: ['Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGame;
export const Game = schemaOrgGame;

export default schemaOrgGame;
