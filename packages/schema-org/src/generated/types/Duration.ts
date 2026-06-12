import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDuration = {
	id: 'schema:Duration',
	name: 'Duration',
	label: 'Duration',
	comment:
		'Quantity: Duration (use [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601)).',
	subClassOf: ['Quantity'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDuration;
export const Duration = schemaOrgDuration;

export default schemaOrgDuration;
