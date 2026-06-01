import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOperatingSystem = {
	id: 'schema:OperatingSystem',
	name: 'OperatingSystem',
	label: 'OperatingSystem',
	comment:
		'System software that manages computer hardware and software resources, and provides common services for computer programs.',
	subClassOf: ['SoftwareApplication', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOperatingSystem;
export const OperatingSystem = schemaOrgOperatingSystem;

export default schemaOrgOperatingSystem;
