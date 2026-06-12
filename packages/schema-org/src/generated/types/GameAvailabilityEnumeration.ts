import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGameAvailabilityEnumeration = {
	id: 'schema:GameAvailabilityEnumeration',
	name: 'GameAvailabilityEnumeration',
	label: 'GameAvailabilityEnumeration',
	comment:
		'For a [[VideoGame]], such as used with a [[PlayGameAction]], an enumeration of the kind of game availability offered. ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGameAvailabilityEnumeration;
export const GameAvailabilityEnumeration = schemaOrgGameAvailabilityEnumeration;

export default schemaOrgGameAvailabilityEnumeration;
