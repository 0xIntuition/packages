import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSearchAction = {
	id: 'schema:SearchAction',
	name: 'SearchAction',
	label: 'SearchAction',
	comment:
		'The act of searching for an object.\\n\\nRelated actions:\\n\\n* [[FindAction]]: SearchAction generally leads to a FindAction, but not necessarily.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:query',
			name: 'query',
			label: 'query',
			comment: 'A sub property of instrument. The query used on this action.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSearchAction;
export const SearchAction = schemaOrgSearchAction;

export default schemaOrgSearchAction;
