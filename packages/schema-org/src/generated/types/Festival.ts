import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFestival = {
	id: 'schema:Festival',
	name: 'Festival',
	label: 'Festival',
	comment: 'Event type: Festival.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFestival;
export const Festival = schemaOrgFestival;

export default schemaOrgFestival;
