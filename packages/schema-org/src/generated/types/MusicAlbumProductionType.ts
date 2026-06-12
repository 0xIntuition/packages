import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicAlbumProductionType = {
	id: 'schema:MusicAlbumProductionType',
	name: 'MusicAlbumProductionType',
	label: 'MusicAlbumProductionType',
	comment:
		'Classification of the album by its type of content: soundtrack, live album, studio album, etc.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicAlbumProductionType;
export const MusicAlbumProductionType = schemaOrgMusicAlbumProductionType;

export default schemaOrgMusicAlbumProductionType;
