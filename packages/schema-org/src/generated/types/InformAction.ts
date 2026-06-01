import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInformAction = {
	id: 'schema:InformAction',
	name: 'InformAction',
	label: 'InformAction',
	comment:
		'The act of notifying someone of information pertinent to them, with no expectation of a response.',
	subClassOf: ['CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:event',
			name: 'event',
			label: 'event',
			comment: 'Upcoming or past event associated with this place, organization, or action.',
			rangeIncludes: ['Event'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInformAction;
export const InformAction = schemaOrgInformAction;

export default schemaOrgInformAction;
