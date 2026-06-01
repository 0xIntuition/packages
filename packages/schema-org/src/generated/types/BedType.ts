import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBedType = {
	id: 'schema:BedType',
	name: 'BedType',
	label: 'BedType',
	comment:
		'A type of bed. This is used for indicating the bed or beds available in an accommodation.',
	subClassOf: ['QualitativeValue', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBedType;
export const BedType = schemaOrgBedType;

export default schemaOrgBedType;
