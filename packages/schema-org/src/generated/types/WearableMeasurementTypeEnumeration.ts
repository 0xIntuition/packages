import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWearableMeasurementTypeEnumeration = {
	id: 'schema:WearableMeasurementTypeEnumeration',
	name: 'WearableMeasurementTypeEnumeration',
	label: 'WearableMeasurementTypeEnumeration',
	comment: 'Enumerates common types of measurement for wearables products.',
	subClassOf: ['MeasurementTypeEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWearableMeasurementTypeEnumeration;
export const WearableMeasurementTypeEnumeration = schemaOrgWearableMeasurementTypeEnumeration;

export default schemaOrgWearableMeasurementTypeEnumeration;
