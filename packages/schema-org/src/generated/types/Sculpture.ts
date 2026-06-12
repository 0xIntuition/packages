import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSculpture = {
	id: 'schema:Sculpture',
	name: 'Sculpture',
	label: 'Sculpture',
	comment: 'A piece of sculpture.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSculpture;
export const Sculpture = schemaOrgSculpture;

export default schemaOrgSculpture;
