import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLegislativeBuilding = {
	id: 'schema:LegislativeBuilding',
	name: 'LegislativeBuilding',
	label: 'LegislativeBuilding',
	comment: 'A legislative building&#x2014;for example, the state capitol.',
	subClassOf: ['GovernmentBuilding', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLegislativeBuilding;
export const LegislativeBuilding = schemaOrgLegislativeBuilding;

export default schemaOrgLegislativeBuilding;
