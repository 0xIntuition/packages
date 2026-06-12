import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConsortium = {
	id: 'schema:Consortium',
	name: 'Consortium',
	label: 'Consortium',
	comment:
		'A Consortium is a membership [[Organization]] whose members are typically Organizations.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConsortium;
export const Consortium = schemaOrgConsortium;

export default schemaOrgConsortium;
