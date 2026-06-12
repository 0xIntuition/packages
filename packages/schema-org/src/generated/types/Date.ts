import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDate = {
	id: 'schema:Date',
	name: 'Date',
	label: 'Date',
	comment: 'A date value in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601).',
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDate;

export default schemaOrgDate;
