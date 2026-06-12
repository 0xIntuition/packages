import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConferenceEvent = {
	id: 'schema:ConferenceEvent',
	name: 'ConferenceEvent',
	label: 'ConferenceEvent',
	comment: 'Event type: Conference event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConferenceEvent;
export const ConferenceEvent = schemaOrgConferenceEvent;

export default schemaOrgConferenceEvent;
