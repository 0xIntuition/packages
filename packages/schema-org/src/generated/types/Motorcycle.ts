import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMotorcycle = {
	id: 'schema:Motorcycle',
	name: 'Motorcycle',
	label: 'Motorcycle',
	comment: 'A motorcycle or motorbike is a single-track, two-wheeled motor vehicle.',
	subClassOf: ['Vehicle', 'Product', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMotorcycle;
export const Motorcycle = schemaOrgMotorcycle;

export default schemaOrgMotorcycle;
