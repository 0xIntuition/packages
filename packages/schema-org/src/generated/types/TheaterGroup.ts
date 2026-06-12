import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTheaterGroup = {
	id: 'schema:TheaterGroup',
	name: 'TheaterGroup',
	label: 'TheaterGroup',
	comment:
		'A theater group or company, for example, the Royal Shakespeare Company or Druid Theatre.',
	subClassOf: ['PerformingGroup', 'Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTheaterGroup;
export const TheaterGroup = schemaOrgTheaterGroup;

export default schemaOrgTheaterGroup;
