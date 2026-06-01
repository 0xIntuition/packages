import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMotorcycleRepair = {
	id: 'schema:MotorcycleRepair',
	name: 'MotorcycleRepair',
	label: 'MotorcycleRepair',
	comment: 'A motorcycle repair shop.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMotorcycleRepair;
export const MotorcycleRepair = schemaOrgMotorcycleRepair;

export default schemaOrgMotorcycleRepair;
