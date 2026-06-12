import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicStore = {
	id: 'schema:MusicStore',
	name: 'MusicStore',
	label: 'MusicStore',
	comment: 'A music store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicStore;
export const MusicStore = schemaOrgMusicStore;

export default schemaOrgMusicStore;
