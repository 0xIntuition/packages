import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgChapter = {
	id: 'schema:Chapter',
	name: 'Chapter',
	label: 'Chapter',
	comment:
		'One of the sections into which a book is divided. A chapter usually has a section number or a name.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:pageEnd',
			name: 'pageEnd',
			label: 'pageEnd',
			comment: 'The page on which the work ends; for example "138" or "xvi".',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:pageStart',
			name: 'pageStart',
			label: 'pageStart',
			comment: 'The page on which the work starts; for example "135" or "xiii".',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:pagination',
			name: 'pagination',
			label: 'pagination',
			comment:
				'Any description of pages that is not separated into pageStart and pageEnd; for example, "1-6, 9, 55" or "10-12, 46-49".',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgChapter;
export const Chapter = schemaOrgChapter;

export default schemaOrgChapter;
