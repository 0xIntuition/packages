import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNotary = {
	id: 'schema:Notary',
	name: 'Notary',
	label: 'Notary',
	comment: 'A notary.',
	subClassOf: ['LegalService', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNotary;
export const Notary = schemaOrgNotary;

export default schemaOrgNotary;
