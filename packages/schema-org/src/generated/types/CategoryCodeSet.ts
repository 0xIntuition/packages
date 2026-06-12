import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCategoryCodeSet = {
	id: 'schema:CategoryCodeSet',
	name: 'CategoryCodeSet',
	label: 'CategoryCodeSet',
	comment: 'A set of Category Code values.',
	subClassOf: ['DefinedTermSet', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:hasCategoryCode',
			name: 'hasCategoryCode',
			label: 'hasCategoryCode',
			comment: 'A Category code contained in this code set.',
			rangeIncludes: ['CategoryCode'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCategoryCodeSet;
export const CategoryCodeSet = schemaOrgCategoryCodeSet;

export default schemaOrgCategoryCodeSet;
