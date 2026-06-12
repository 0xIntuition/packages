import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutoRental = {
	id: 'schema:AutoRental',
	name: 'AutoRental',
	label: 'AutoRental',
	comment: 'A car rental business.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutoRental;
export const AutoRental = schemaOrgAutoRental;

export default schemaOrgAutoRental;
