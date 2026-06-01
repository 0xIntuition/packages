import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCooperative = {
	id: 'schema:Cooperative',
	name: 'Cooperative',
	label: 'Cooperative',
	comment: 'An organization that is a joint project of multiple organizations or persons.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCooperative;
export const Cooperative = schemaOrgCooperative;

export default schemaOrgCooperative;
