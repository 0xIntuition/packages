import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicVideoObject = {
	id: 'schema:MusicVideoObject',
	name: 'MusicVideoObject',
	label: 'MusicVideoObject',
	comment: 'A music video file.',
	subClassOf: ['MediaObject', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicVideoObject;
export const MusicVideoObject = schemaOrgMusicVideoObject;

export default schemaOrgMusicVideoObject;
