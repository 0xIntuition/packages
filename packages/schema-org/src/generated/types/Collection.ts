import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCollection = {
	id: 'schema:Collection',
	name: 'Collection',
	label: 'Collection',
	comment: 'A collection of items, e.g. creative works or products.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:collectionSize',
			name: 'collectionSize',
			label: 'collectionSize',
			comment: 'The number of items in the [[Collection]].',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCollection;
export const Collection = schemaOrgCollection;

export default schemaOrgCollection;
