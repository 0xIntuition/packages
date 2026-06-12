import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEducationEvent = {
	id: 'schema:EducationEvent',
	name: 'EducationEvent',
	label: 'EducationEvent',
	comment: 'Event type: Education event.',
	subClassOf: ['Event', 'Thing'],
	properties: [
		{
			id: 'schema:assesses',
			name: 'assesses',
			label: 'assesses',
			comment:
				'The item being described is intended to assess the competency or learning outcome defined by the referenced term.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:educationalLevel',
			name: 'educationalLevel',
			label: 'educationalLevel',
			comment:
				"The level in terms of progression through an educational or training context. Examples of educational levels include 'beginner', 'intermediate' or 'advanced', and formal sets of level indicators.",
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:teaches',
			name: 'teaches',
			label: 'teaches',
			comment:
				'The item being described is intended to help a person learn the competency or learning outcome defined by the referenced term.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEducationEvent;
export const EducationEvent = schemaOrgEducationEvent;

export default schemaOrgEducationEvent;
