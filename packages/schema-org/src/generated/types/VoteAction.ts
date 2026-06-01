import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVoteAction = {
	id: 'schema:VoteAction',
	name: 'VoteAction',
	label: 'VoteAction',
	comment:
		'The act of expressing a preference from a fixed/finite/structured set of choices/options.',
	subClassOf: ['ChooseAction', 'AssessAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:candidate',
			name: 'candidate',
			label: 'candidate',
			comment: 'A sub property of object. The candidate subject of this action.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVoteAction;
export const VoteAction = schemaOrgVoteAction;

export default schemaOrgVoteAction;
