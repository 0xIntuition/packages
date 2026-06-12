import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReplaceAction = {
	id: 'schema:ReplaceAction',
	name: 'ReplaceAction',
	label: 'ReplaceAction',
	comment: 'The act of editing a recipient by replacing an old object with a new object.',
	subClassOf: ['UpdateAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:replacee',
			name: 'replacee',
			label: 'replacee',
			comment: 'A sub property of object. The object that is being replaced.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:replacer',
			name: 'replacer',
			label: 'replacer',
			comment: 'A sub property of object. The object that replaces.',
			rangeIncludes: ['Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReplaceAction;
export const ReplaceAction = schemaOrgReplaceAction;

export default schemaOrgReplaceAction;
