import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDanceEvent = {
	id: 'schema:DanceEvent',
	name: 'DanceEvent',
	label: 'DanceEvent',
	comment: 'Event type: A social dance.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDanceEvent;
export const DanceEvent = schemaOrgDanceEvent;

export default schemaOrgDanceEvent;
