import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMeasurementTypeEnumeration = {
	id: 'schema:MeasurementTypeEnumeration',
	name: 'MeasurementTypeEnumeration',
	label: 'MeasurementTypeEnumeration',
	comment:
		'Enumeration of common measurement types (or dimensions), for example "chest" for a person, "inseam" for pants, "gauge" for screws, or "wheel" for bicycles.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMeasurementTypeEnumeration;
export const MeasurementTypeEnumeration = schemaOrgMeasurementTypeEnumeration;

export default schemaOrgMeasurementTypeEnumeration;
