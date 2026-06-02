import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRoofingContractor = {
	id: 'schema:RoofingContractor',
	name: 'RoofingContractor',
	label: 'RoofingContractor',
	comment: 'A roofing contractor.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRoofingContractor;
export const RoofingContractor = schemaOrgRoofingContractor;

export default schemaOrgRoofingContractor;
