import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNGO = {
	id: 'schema:NGO',
	name: 'NGO',
	label: 'NGO',
	comment: 'Organization: Non-governmental Organization.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNGO;
export const NGO = schemaOrgNGO;

export default schemaOrgNGO;
