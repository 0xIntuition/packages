import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComedyEvent = {
	id: 'schema:ComedyEvent',
	name: 'ComedyEvent',
	label: 'ComedyEvent',
	comment: 'Event type: Comedy event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComedyEvent;
export const ComedyEvent = schemaOrgComedyEvent;

export default schemaOrgComedyEvent;
