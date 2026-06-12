import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgError = {
	id: 'schema:Error',
	name: 'Error',
	label: 'Error',
	comment: 'Representation of an Error.',
	subClassOf: ['InstantaneousEvent', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:errorCode',
			name: 'errorCode',
			label: 'errorCode',
			comment: 'Application or platform dependant error code.',
			rangeIncludes: ['DefinedTerm', 'Integer', 'StatusEnumeration', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgError;

export default schemaOrgError;
