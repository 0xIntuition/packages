import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDateTime = {
	id: 'schema:DateTime',
	name: 'DateTime',
	label: 'DateTime',
	comment:
		'A combination of date and time of day in the form [-]CCYY-MM-DDThh:mm:ss[Z|(+|-)hh:mm] (see Chapter 5.4 of ISO 8601).',
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDateTime;
export const DateTime = schemaOrgDateTime;

export default schemaOrgDateTime;
