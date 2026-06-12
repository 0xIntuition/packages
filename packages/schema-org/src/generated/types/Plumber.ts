import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlumber = {
	id: 'schema:Plumber',
	name: 'Plumber',
	label: 'Plumber',
	comment: 'A plumbing service.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlumber;
export const Plumber = schemaOrgPlumber;

export default schemaOrgPlumber;
