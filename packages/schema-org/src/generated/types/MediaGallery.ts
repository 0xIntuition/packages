import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaGallery = {
	id: 'schema:MediaGallery',
	name: 'MediaGallery',
	label: 'MediaGallery',
	comment:
		'Web page type: Media gallery page. A mixed-media page that can contain media such as images, videos, and other multimedia.',
	subClassOf: ['CollectionPage', 'WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaGallery;
export const MediaGallery = schemaOrgMediaGallery;

export default schemaOrgMediaGallery;
