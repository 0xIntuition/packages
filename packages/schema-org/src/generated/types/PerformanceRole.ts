import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPerformanceRole = {
	id: 'schema:PerformanceRole',
	name: 'PerformanceRole',
	label: 'PerformanceRole',
	comment:
		'A PerformanceRole is a Role that some entity places with regard to a theatrical performance, e.g. in a Movie, TVSeries etc.',
	subClassOf: ['Role', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:characterName',
			name: 'characterName',
			label: 'characterName',
			comment:
				'The name of a character played in some acting or performing role, i.e. in a PerformanceRole.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPerformanceRole;
export const PerformanceRole = schemaOrgPerformanceRole;

export default schemaOrgPerformanceRole;
