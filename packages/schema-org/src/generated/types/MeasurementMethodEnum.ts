import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMeasurementMethodEnum = {
	id: 'schema:MeasurementMethodEnum',
	name: 'MeasurementMethodEnum',
	label: 'MeasurementMethodEnum',
	comment: 'Enumeration(s) for use with [[measurementMethod]].',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMeasurementMethodEnum;
export const MeasurementMethodEnum = schemaOrgMeasurementMethodEnum;

export default schemaOrgMeasurementMethodEnum;
