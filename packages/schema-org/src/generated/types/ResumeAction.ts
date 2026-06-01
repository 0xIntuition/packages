import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResumeAction = {
	id: 'schema:ResumeAction',
	name: 'ResumeAction',
	label: 'ResumeAction',
	comment:
		'The act of resuming a device or application which was formerly paused (e.g. resume music playback or resume a timer).',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResumeAction;
export const ResumeAction = schemaOrgResumeAction;

export default schemaOrgResumeAction;
