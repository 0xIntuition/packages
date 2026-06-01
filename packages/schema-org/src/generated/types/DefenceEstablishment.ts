import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDefenceEstablishment = {
	id: 'schema:DefenceEstablishment',
	name: 'DefenceEstablishment',
	label: 'DefenceEstablishment',
	comment: 'A defence establishment, such as an army or navy base.',
	subClassOf: ['GovernmentBuilding', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDefenceEstablishment;
export const DefenceEstablishment = schemaOrgDefenceEstablishment;

export default schemaOrgDefenceEstablishment;
