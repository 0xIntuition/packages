import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConversation = {
	id: 'schema:Conversation',
	name: 'Conversation',
	label: 'Conversation',
	comment:
		'One or more messages between organizations or people on a particular topic. Individual messages can be linked to the conversation with isPartOf or hasPart properties.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConversation;
export const Conversation = schemaOrgConversation;

export default schemaOrgConversation;
