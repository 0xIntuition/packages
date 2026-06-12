import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgControlAction = {
	id: 'schema:ControlAction',
	name: 'ControlAction',
	label: 'ControlAction',
	comment: 'An agent controls a device or application.',
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgControlAction;
export const ControlAction = schemaOrgControlAction;

export default schemaOrgControlAction;
