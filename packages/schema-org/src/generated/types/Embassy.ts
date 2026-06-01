import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmbassy = {
	id: 'schema:Embassy',
	name: 'Embassy',
	label: 'Embassy',
	comment: 'An embassy.',
	subClassOf: ['GovernmentBuilding', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmbassy;
export const Embassy = schemaOrgEmbassy;

export default schemaOrgEmbassy;
