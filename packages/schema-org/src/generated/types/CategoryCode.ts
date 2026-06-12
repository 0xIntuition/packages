import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCategoryCode = {
	id: 'schema:CategoryCode',
	name: 'CategoryCode',
	label: 'CategoryCode',
	comment: 'A Category Code.',
	subClassOf: ['DefinedTerm', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:codeValue',
			name: 'codeValue',
			label: 'codeValue',
			comment: 'A short textual code that uniquely identifies the value.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:inCodeSet',
			name: 'inCodeSet',
			label: 'inCodeSet',
			comment: 'A [[CategoryCodeSet]] that contains this category code.',
			rangeIncludes: ['CategoryCodeSet', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCategoryCode;
export const CategoryCode = schemaOrgCategoryCode;

export default schemaOrgCategoryCode;
