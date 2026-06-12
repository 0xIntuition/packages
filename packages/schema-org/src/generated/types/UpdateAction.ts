import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUpdateAction = {
	id: 'schema:UpdateAction',
	name: 'UpdateAction',
	label: 'UpdateAction',
	comment: 'The act of managing by changing/editing the state of the object.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:collection',
			name: 'collection',
			label: 'collection',
			comment: 'A sub property of object. The collection target of the action.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:targetCollection',
			name: 'targetCollection',
			label: 'targetCollection',
			comment: 'A sub property of object. The collection target of the action.',
			rangeIncludes: ['Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUpdateAction;
export const UpdateAction = schemaOrgUpdateAction;

export default schemaOrgUpdateAction;
