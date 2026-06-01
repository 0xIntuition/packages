import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgItemPage = {
	id: 'schema:ItemPage',
	name: 'ItemPage',
	label: 'ItemPage',
	comment: 'A page devoted to a single item, such as a particular product or hotel.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgItemPage;
export const ItemPage = schemaOrgItemPage;

export default schemaOrgItemPage;
