import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCarUsageType = {
	id: 'schema:CarUsageType',
	name: 'CarUsageType',
	label: 'CarUsageType',
	comment:
		'A value indicating a special usage of a car, e.g. commercial rental, driving school, or as a taxi.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCarUsageType;
export const CarUsageType = schemaOrgCarUsageType;

export default schemaOrgCarUsageType;
