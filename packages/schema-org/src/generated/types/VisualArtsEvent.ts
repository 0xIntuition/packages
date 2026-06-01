import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVisualArtsEvent = {
	id: 'schema:VisualArtsEvent',
	name: 'VisualArtsEvent',
	label: 'VisualArtsEvent',
	comment: 'Event type: Visual arts event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVisualArtsEvent;
export const VisualArtsEvent = schemaOrgVisualArtsEvent;

export default schemaOrgVisualArtsEvent;
