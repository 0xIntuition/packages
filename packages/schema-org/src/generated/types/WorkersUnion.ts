import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWorkersUnion = {
	id: 'schema:WorkersUnion',
	name: 'WorkersUnion',
	label: 'WorkersUnion',
	comment:
		'A Workers Union (also known as a Labor Union, Labour Union, or Trade Union) is an organization that promotes the interests of its worker members by collectively bargaining with management, organizing, and political lobbying.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWorkersUnion;
export const WorkersUnion = schemaOrgWorkersUnion;

export default schemaOrgWorkersUnion;
