import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRealEstateAgent = {
	id: 'schema:RealEstateAgent',
	name: 'RealEstateAgent',
	label: 'RealEstateAgent',
	comment: 'A real-estate agent.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRealEstateAgent;
export const RealEstateAgent = schemaOrgRealEstateAgent;

export default schemaOrgRealEstateAgent;
