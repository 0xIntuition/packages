import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgItemAvailability = {
	id: 'schema:ItemAvailability',
	name: 'ItemAvailability',
	label: 'ItemAvailability',
	comment: 'A list of possible product availability options.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgItemAvailability;
export const ItemAvailability = schemaOrgItemAvailability;

export default schemaOrgItemAvailability;
