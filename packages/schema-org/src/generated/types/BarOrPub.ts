import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBarOrPub = {
	id: 'schema:BarOrPub',
	name: 'BarOrPub',
	label: 'BarOrPub',
	comment: 'A bar or pub.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBarOrPub;
export const BarOrPub = schemaOrgBarOrPub;

export default schemaOrgBarOrPub;
