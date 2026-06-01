import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVideoGallery = {
	id: 'schema:VideoGallery',
	name: 'VideoGallery',
	label: 'VideoGallery',
	comment: 'Web page type: Video gallery page.',
	subClassOf: ['MediaGallery', 'CollectionPage', 'WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVideoGallery;
export const VideoGallery = schemaOrgVideoGallery;

export default schemaOrgVideoGallery;
