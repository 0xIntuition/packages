import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaintAction = {
	id: 'schema:PaintAction',
	name: 'PaintAction',
	label: 'PaintAction',
	comment: 'The act of producing a painting, typically with paint and canvas as instruments.',
	subClassOf: ['CreateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaintAction;
export const PaintAction = schemaOrgPaintAction;

export default schemaOrgPaintAction;
