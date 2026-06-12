import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAuthorizeAction = {
	id: 'schema:AuthorizeAction',
	name: 'AuthorizeAction',
	label: 'AuthorizeAction',
	comment: 'The act of granting permission to an object.',
	subClassOf: ['AllocateAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:recipient',
			name: 'recipient',
			label: 'recipient',
			comment:
				'A sub property of participant. The participant who is at the receiving end of the action.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAuthorizeAction;
export const AuthorizeAction = schemaOrgAuthorizeAction;

export default schemaOrgAuthorizeAction;
