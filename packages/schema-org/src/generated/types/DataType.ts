import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDataType = {
	id: 'schema:DataType',
	name: 'DataType',
	label: 'DataType',
	comment: 'The basic data types such as Integers, Strings, etc.',
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDataType;
export const DataType = schemaOrgDataType;

export default schemaOrgDataType;
