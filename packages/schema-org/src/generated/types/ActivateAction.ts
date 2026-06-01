import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgActivateAction = {
	id: 'schema:ActivateAction',
	name: 'ActivateAction',
	label: 'ActivateAction',
	comment:
		'The act of starting or activating a device or application (e.g. starting a timer or turning on a flashlight).',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgActivateAction;
export const ActivateAction = schemaOrgActivateAction;

export default schemaOrgActivateAction;
