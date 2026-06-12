import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhotograph = {
	id: 'schema:Photograph',
	name: 'Photograph',
	label: 'Photograph',
	comment: 'A photograph.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhotograph;
export const Photograph = schemaOrgPhotograph;

export default schemaOrgPhotograph;
