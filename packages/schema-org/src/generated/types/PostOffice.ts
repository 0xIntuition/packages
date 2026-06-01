import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPostOffice = {
	id: 'schema:PostOffice',
	name: 'PostOffice',
	label: 'PostOffice',
	comment: 'A post office.',
	subClassOf: ['GovernmentOffice', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPostOffice;
export const PostOffice = schemaOrgPostOffice;

export default schemaOrgPostOffice;
