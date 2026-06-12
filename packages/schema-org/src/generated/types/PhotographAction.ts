import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhotographAction = {
	id: 'schema:PhotographAction',
	name: 'PhotographAction',
	label: 'PhotographAction',
	comment: 'The act of capturing still images of objects using a camera.',
	subClassOf: ['CreateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhotographAction;
export const PhotographAction = schemaOrgPhotographAction;

export default schemaOrgPhotographAction;
