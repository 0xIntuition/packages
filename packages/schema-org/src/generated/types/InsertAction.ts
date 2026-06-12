import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInsertAction = {
	id: 'schema:InsertAction',
	name: 'InsertAction',
	label: 'InsertAction',
	comment: 'The act of adding at a specific location in an ordered collection.',
	subClassOf: ['AddAction', 'UpdateAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:toLocation',
			name: 'toLocation',
			label: 'toLocation',
			comment:
				'A sub property of location. The final location of the object or the agent after the action.',
			rangeIncludes: ['Place'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInsertAction;
export const InsertAction = schemaOrgInsertAction;

export default schemaOrgInsertAction;
