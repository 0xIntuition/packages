import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLiteraryEvent = {
	id: 'schema:LiteraryEvent',
	name: 'LiteraryEvent',
	label: 'LiteraryEvent',
	comment: 'Event type: Literary event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLiteraryEvent;
export const LiteraryEvent = schemaOrgLiteraryEvent;

export default schemaOrgLiteraryEvent;
