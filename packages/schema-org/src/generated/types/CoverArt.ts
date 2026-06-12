import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCoverArt = {
	id: 'schema:CoverArt',
	name: 'CoverArt',
	label: 'CoverArt',
	comment: 'The artwork on the outer surface of a CreativeWork.',
	subClassOf: ['VisualArtwork', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCoverArt;
export const CoverArt = schemaOrgCoverArt;

export default schemaOrgCoverArt;
