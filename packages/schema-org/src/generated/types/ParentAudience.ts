import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgParentAudience = {
	id: 'schema:ParentAudience',
	name: 'ParentAudience',
	label: 'ParentAudience',
	comment:
		'A set of characteristics describing parents, who can be interested in viewing some content.',
	subClassOf: ['PeopleAudience', 'Audience', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:childMaxAge',
			name: 'childMaxAge',
			label: 'childMaxAge',
			comment: 'Maximal age of the child.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:childMinAge',
			name: 'childMinAge',
			label: 'childMinAge',
			comment: 'Minimal age of the child.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgParentAudience;
export const ParentAudience = schemaOrgParentAudience;

export default schemaOrgParentAudience;
