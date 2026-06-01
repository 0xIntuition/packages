import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInternetCafe = {
	id: 'schema:InternetCafe',
	name: 'InternetCafe',
	label: 'InternetCafe',
	comment: 'An internet cafe.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInternetCafe;
export const InternetCafe = schemaOrgInternetCafe;

export default schemaOrgInternetCafe;
