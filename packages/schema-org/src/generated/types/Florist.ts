import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFlorist = {
	id: 'schema:Florist',
	name: 'Florist',
	label: 'Florist',
	comment: 'A florist.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFlorist;
export const Florist = schemaOrgFlorist;

export default schemaOrgFlorist;
