import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGameServerStatus = {
	id: 'schema:GameServerStatus',
	name: 'GameServerStatus',
	label: 'GameServerStatus',
	comment: 'Status of a game server.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGameServerStatus;
export const GameServerStatus = schemaOrgGameServerStatus;

export default schemaOrgGameServerStatus;
