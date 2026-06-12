import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGamePlayMode = {
	id: 'schema:GamePlayMode',
	name: 'GamePlayMode',
	label: 'GamePlayMode',
	comment: 'Indicates whether this game is multi-player, co-op or single-player.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGamePlayMode;
export const GamePlayMode = schemaOrgGamePlayMode;

export default schemaOrgGamePlayMode;
