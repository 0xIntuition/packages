import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEventVenue = {
	id: 'schema:EventVenue',
	name: 'EventVenue',
	label: 'EventVenue',
	comment: 'An event venue.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEventVenue;
export const EventVenue = schemaOrgEventVenue;

export default schemaOrgEventVenue;
