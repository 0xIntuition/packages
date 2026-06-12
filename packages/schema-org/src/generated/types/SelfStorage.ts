import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSelfStorage = {
	id: 'schema:SelfStorage',
	name: 'SelfStorage',
	label: 'SelfStorage',
	comment: 'A self-storage facility.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSelfStorage;
export const SelfStorage = schemaOrgSelfStorage;

export default schemaOrgSelfStorage;
