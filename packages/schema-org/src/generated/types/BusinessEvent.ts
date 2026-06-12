import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusinessEvent = {
	id: 'schema:BusinessEvent',
	name: 'BusinessEvent',
	label: 'BusinessEvent',
	comment: 'Event type: Business event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusinessEvent;
export const BusinessEvent = schemaOrgBusinessEvent;

export default schemaOrgBusinessEvent;
