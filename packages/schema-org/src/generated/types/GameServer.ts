import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGameServer = {
	id: 'schema:GameServer',
	name: 'GameServer',
	label: 'GameServer',
	comment: 'Server that provides game interaction in a multiplayer game.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:game',
			name: 'game',
			label: 'game',
			comment: 'Video game which is played on this server.',
			rangeIncludes: ['VideoGame'],
		},
		{
			id: 'schema:playersOnline',
			name: 'playersOnline',
			label: 'playersOnline',
			comment: 'Number of players on the server.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:serverStatus',
			name: 'serverStatus',
			label: 'serverStatus',
			comment: 'Status of a game server.',
			rangeIncludes: ['GameServerStatus'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGameServer;
export const GameServer = schemaOrgGameServer;

export default schemaOrgGameServer;
