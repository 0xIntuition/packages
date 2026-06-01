import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPawnShop = {
	id: 'schema:PawnShop',
	name: 'PawnShop',
	label: 'PawnShop',
	comment: 'A shop that will buy, or lend money against the security of, personal possessions.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPawnShop;
export const PawnShop = schemaOrgPawnShop;

export default schemaOrgPawnShop;
