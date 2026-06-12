import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWebSite = {
	id: 'schema:WebSite',
	name: 'WebSite',
	label: 'WebSite',
	comment:
		'A WebSite is a set of related web pages and other items typically served from a single web domain and accessible via URLs.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:issn',
			name: 'issn',
			label: 'issn',
			comment:
				'The International Standard Serial Number (ISSN) that identifies this serial publication. You can repeat this property to identify different formats of, or the linking ISSN (ISSN-L) for, this serial publication.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWebSite;
export const WebSite = schemaOrgWebSite;

export default schemaOrgWebSite;
