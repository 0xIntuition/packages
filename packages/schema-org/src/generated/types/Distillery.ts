import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDistillery = {
	id: 'schema:Distillery',
	name: 'Distillery',
	label: 'Distillery',
	comment: 'A distillery.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDistillery;
export const Distillery = schemaOrgDistillery;

export default schemaOrgDistillery;
