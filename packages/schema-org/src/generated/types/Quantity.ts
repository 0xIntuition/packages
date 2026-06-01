import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuantity = {
	id: 'schema:Quantity',
	name: 'Quantity',
	label: 'Quantity',
	comment:
		"Quantities such as distance, time, mass, weight, etc. Particular instances of say Mass are strings like '3 kg' or '4 milligrams'.",
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQuantity;
export const Quantity = schemaOrgQuantity;

export default schemaOrgQuantity;
