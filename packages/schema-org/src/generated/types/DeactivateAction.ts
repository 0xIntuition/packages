import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDeactivateAction = {
	id: 'schema:DeactivateAction',
	name: 'DeactivateAction',
	label: 'DeactivateAction',
	comment:
		'The act of stopping or deactivating a device or application (e.g. stopping a timer or turning off a flashlight).',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDeactivateAction;
export const DeactivateAction = schemaOrgDeactivateAction;

export default schemaOrgDeactivateAction;
