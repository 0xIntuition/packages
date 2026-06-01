import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgChildrensEvent = {
	id: 'schema:ChildrensEvent',
	name: 'ChildrensEvent',
	label: 'ChildrensEvent',
	comment: "Event type: Children's event.",
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgChildrensEvent;
export const ChildrensEvent = schemaOrgChildrensEvent;

export default schemaOrgChildrensEvent;
