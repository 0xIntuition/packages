import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTheaterEvent = {
	id: 'schema:TheaterEvent',
	name: 'TheaterEvent',
	label: 'TheaterEvent',
	comment: 'Event type: Theater performance.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTheaterEvent;
export const TheaterEvent = schemaOrgTheaterEvent;

export default schemaOrgTheaterEvent;
