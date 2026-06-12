import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrawAction = {
	id: 'schema:DrawAction',
	name: 'DrawAction',
	label: 'DrawAction',
	comment:
		'The act of producing a visual/graphical representation of an object, typically with a pen/pencil and paper as instruments.',
	subClassOf: ['CreateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrawAction;
export const DrawAction = schemaOrgDrawAction;

export default schemaOrgDrawAction;
