import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrawing = {
	id: 'schema:Drawing',
	name: 'Drawing',
	label: 'Drawing',
	comment: 'A picture or diagram made with a pencil, pen, or crayon rather than paint.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrawing;
export const Drawing = schemaOrgDrawing;

export default schemaOrgDrawing;
