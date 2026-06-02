import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPublicSwimmingPool = {
	id: 'schema:PublicSwimmingPool',
	name: 'PublicSwimmingPool',
	label: 'PublicSwimmingPool',
	comment: 'A public swimming pool.',
	subClassOf: ['SportsActivityLocation', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPublicSwimmingPool;
export const PublicSwimmingPool = schemaOrgPublicSwimmingPool;

export default schemaOrgPublicSwimmingPool;
