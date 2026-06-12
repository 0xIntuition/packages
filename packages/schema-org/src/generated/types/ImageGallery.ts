import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgImageGallery = {
	id: 'schema:ImageGallery',
	name: 'ImageGallery',
	label: 'ImageGallery',
	comment: 'Web page type: Image gallery page.',
	subClassOf: ['MediaGallery', 'CollectionPage', 'WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgImageGallery;
export const ImageGallery = schemaOrgImageGallery;

export default schemaOrgImageGallery;
