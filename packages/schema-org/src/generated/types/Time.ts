import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTime = {
	id: 'schema:Time',
	name: 'Time',
	label: 'Time',
	comment:
		'A point in time recurring on multiple days in the form hh:mm:ss[Z|(+|-)hh:mm] (see [XML schema for details](http://www.w3.org/TR/xmlschema-2/#time)).',
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTime;
export const Time = schemaOrgTime;

export default schemaOrgTime;
