import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGovernmentBuilding = {
	id: 'schema:GovernmentBuilding',
	name: 'GovernmentBuilding',
	label: 'GovernmentBuilding',
	comment: 'A government building.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGovernmentBuilding;
export const GovernmentBuilding = schemaOrgGovernmentBuilding;

export default schemaOrgGovernmentBuilding;
