import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPerformingGroup = {
	id: 'schema:PerformingGroup',
	name: 'PerformingGroup',
	label: 'PerformingGroup',
	comment: 'A performance group, such as a band, an orchestra, or a circus.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPerformingGroup;
export const PerformingGroup = schemaOrgPerformingGroup;

export default schemaOrgPerformingGroup;
