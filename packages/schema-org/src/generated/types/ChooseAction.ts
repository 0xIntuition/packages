import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgChooseAction = {
	id: 'schema:ChooseAction',
	name: 'ChooseAction',
	label: 'ChooseAction',
	comment:
		'The act of expressing a preference from a set of options or a large or unbounded set of choices/options.',
	subClassOf: ['AssessAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:actionOption',
			name: 'actionOption',
			label: 'actionOption',
			comment: 'A sub property of object. The options subject to this action.',
			rangeIncludes: ['Text', 'Thing'],
		},
		{
			id: 'schema:option',
			name: 'option',
			label: 'option',
			comment: 'A sub property of object. The options subject to this action.',
			rangeIncludes: ['Text', 'Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgChooseAction;
export const ChooseAction = schemaOrgChooseAction;

export default schemaOrgChooseAction;
