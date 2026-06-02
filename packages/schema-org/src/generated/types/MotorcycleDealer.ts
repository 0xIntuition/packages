import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMotorcycleDealer = {
	id: 'schema:MotorcycleDealer',
	name: 'MotorcycleDealer',
	label: 'MotorcycleDealer',
	comment: 'A motorcycle dealer.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMotorcycleDealer;
export const MotorcycleDealer = schemaOrgMotorcycleDealer;

export default schemaOrgMotorcycleDealer;
