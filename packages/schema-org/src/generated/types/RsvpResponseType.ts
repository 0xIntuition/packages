import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRsvpResponseType = {
	id: 'schema:RsvpResponseType',
	name: 'RsvpResponseType',
	label: 'RsvpResponseType',
	comment:
		'RsvpResponseType is an enumeration type whose instances represent responding to an RSVP request.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRsvpResponseType;
export const RsvpResponseType = schemaOrgRsvpResponseType;

export default schemaOrgRsvpResponseType;
