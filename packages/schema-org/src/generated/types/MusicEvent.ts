import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicEvent = {
	id: 'schema:MusicEvent',
	name: 'MusicEvent',
	label: 'MusicEvent',
	comment: 'Event type: Music event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicEvent;
export const MusicEvent = schemaOrgMusicEvent;

export default schemaOrgMusicEvent;
