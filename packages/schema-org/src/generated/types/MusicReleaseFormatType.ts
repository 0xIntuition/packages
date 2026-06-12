import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicReleaseFormatType = {
	id: 'schema:MusicReleaseFormatType',
	name: 'MusicReleaseFormatType',
	label: 'MusicReleaseFormatType',
	comment:
		'Format of this release (the type of recording media used, i.e. compact disc, digital media, LP, etc.).',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicReleaseFormatType;
export const MusicReleaseFormatType = schemaOrgMusicReleaseFormatType;

export default schemaOrgMusicReleaseFormatType;
