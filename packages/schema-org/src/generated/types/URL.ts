import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgURL = {
	id: 'schema:URL',
	name: 'URL',
	label: 'URL',
	comment: 'Data type: URL.',
	subClassOf: ['Text'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgURL;

export default schemaOrgURL;
