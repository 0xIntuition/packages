import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDiscoverAction = {
	id: 'schema:DiscoverAction',
	name: 'DiscoverAction',
	label: 'DiscoverAction',
	comment: 'The act of discovering/finding an object.',
	subClassOf: ['FindAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDiscoverAction;
export const DiscoverAction = schemaOrgDiscoverAction;

export default schemaOrgDiscoverAction;
