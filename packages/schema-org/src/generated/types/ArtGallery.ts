import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgArtGallery = {
	id: 'schema:ArtGallery',
	name: 'ArtGallery',
	label: 'ArtGallery',
	comment: 'An art gallery.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgArtGallery;
export const ArtGallery = schemaOrgArtGallery;

export default schemaOrgArtGallery;
