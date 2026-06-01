import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCollectionPage = {
	id: 'schema:CollectionPage',
	name: 'CollectionPage',
	label: 'CollectionPage',
	comment: 'Web page type: Collection page.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCollectionPage;
export const CollectionPage = schemaOrgCollectionPage;

export default schemaOrgCollectionPage;
