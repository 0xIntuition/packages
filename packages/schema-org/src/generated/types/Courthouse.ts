import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCourthouse = {
	id: 'schema:Courthouse',
	name: 'Courthouse',
	label: 'Courthouse',
	comment: 'A courthouse.',
	subClassOf: ['GovernmentBuilding', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCourthouse;
export const Courthouse = schemaOrgCourthouse;

export default schemaOrgCourthouse;
