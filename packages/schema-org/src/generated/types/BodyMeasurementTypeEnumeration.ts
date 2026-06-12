import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBodyMeasurementTypeEnumeration = {
	id: 'schema:BodyMeasurementTypeEnumeration',
	name: 'BodyMeasurementTypeEnumeration',
	label: 'BodyMeasurementTypeEnumeration',
	comment:
		"Enumerates types (or dimensions) of a person's body measurements, for example for fitting of clothes.",
	subClassOf: ['MeasurementTypeEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBodyMeasurementTypeEnumeration;
export const BodyMeasurementTypeEnumeration = schemaOrgBodyMeasurementTypeEnumeration;

export default schemaOrgBodyMeasurementTypeEnumeration;
