import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWebApplication = {
	id: 'schema:WebApplication',
	name: 'WebApplication',
	label: 'WebApplication',
	comment: 'Web applications.',
	subClassOf: ['SoftwareApplication', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:browserRequirements',
			name: 'browserRequirements',
			label: 'browserRequirements',
			comment:
				"Specifies browser requirements in human-readable text. For example, 'requires HTML5 support'.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWebApplication;
export const WebApplication = schemaOrgWebApplication;

export default schemaOrgWebApplication;
