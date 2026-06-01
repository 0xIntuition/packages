import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRuntimePlatform = {
	id: 'schema:RuntimePlatform',
	name: 'RuntimePlatform',
	label: 'RuntimePlatform',
	comment:
		'Specialized software environment that provides the essential infrastructure, libraries, and services required to execute a program.',
	subClassOf: ['SoftwareApplication', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRuntimePlatform;
export const RuntimePlatform = schemaOrgRuntimePlatform;

export default schemaOrgRuntimePlatform;
