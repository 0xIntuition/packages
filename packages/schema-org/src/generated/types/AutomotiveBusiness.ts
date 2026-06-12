import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutomotiveBusiness = {
	id: 'schema:AutomotiveBusiness',
	name: 'AutomotiveBusiness',
	label: 'AutomotiveBusiness',
	comment: 'Car repair, sales, or parts.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutomotiveBusiness;
export const AutomotiveBusiness = schemaOrgAutomotiveBusiness;

export default schemaOrgAutomotiveBusiness;
