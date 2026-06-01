import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMountain = {
	id: 'schema:Mountain',
	name: 'Mountain',
	label: 'Mountain',
	comment: 'A mountain, like Mount Whitney or Mount Everest.',
	subClassOf: ['Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMountain;
export const Mountain = schemaOrgMountain;

export default schemaOrgMountain;
