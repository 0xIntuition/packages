import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSuspendAction = {
	id: 'schema:SuspendAction',
	name: 'SuspendAction',
	label: 'SuspendAction',
	comment:
		'The act of momentarily pausing a device or application (e.g. pause music playback or pause a timer).',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSuspendAction;
export const SuspendAction = schemaOrgSuspendAction;

export default schemaOrgSuspendAction;
