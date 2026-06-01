import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicVenue = {
	id: 'schema:MusicVenue',
	name: 'MusicVenue',
	label: 'MusicVenue',
	comment: 'A music venue.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicVenue;
export const MusicVenue = schemaOrgMusicVenue;

export default schemaOrgMusicVenue;
