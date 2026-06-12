import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPainting = {
	id: 'schema:Painting',
	name: 'Painting',
	label: 'Painting',
	comment: 'A painting.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPainting;
export const Painting = schemaOrgPainting;

export default schemaOrgPainting;
