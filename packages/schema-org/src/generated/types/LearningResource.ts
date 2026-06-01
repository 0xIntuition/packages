import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLearningResource = {
	id: 'schema:LearningResource',
	name: 'LearningResource',
	label: 'LearningResource',
	comment:
		'The LearningResource type can be used to indicate [[CreativeWork]]s (whether physical or digital) that have a particular and explicit orientation towards learning, education, skill acquisition, and other educational purposes.\n\n[[LearningResource]] is expected to be used as an addition to a primary type such as [[Book]], [[VideoObject]], [[Product]] etc.\n\n[[EducationEvent]] serves a similar purpose for event-like things (e.g. a [[Trip]]). A [[LearningResource]] may be created as a result of an [[EducationEvent]], for example by recording one.',
	subClassOf: ['CreativeWork', 'Thing'],
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
			id: 'schema:competencyRequired',
			name: 'competencyRequired',
			label: 'competencyRequired',
			comment:
				'Knowledge, skill, ability or personal attribute that must be demonstrated by a person or other entity in order to do something such as earn an Educational Occupational Credential or understand a LearningResource.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:educationalAlignment',
			name: 'educationalAlignment',
			label: 'educationalAlignment',
			comment:
				'An alignment to an established educational framework.\n\nThis property should not be used where the nature of the alignment can be described using a simple property, for example to express that a resource [[teaches]] or [[assesses]] a competency.',
			rangeIncludes: ['AlignmentObject'],
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
			id: 'schema:educationalUse',
			name: 'educationalUse',
			label: 'educationalUse',
			comment:
				"The purpose of a work in the context of education; for example, 'assignment', 'group work'.",
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:learningResourceType',
			name: 'learningResourceType',
			label: 'learningResourceType',
			comment:
				"The predominant type or kind characterizing the learning resource. For example, 'presentation', 'handout'.",
			rangeIncludes: ['DefinedTerm', 'Text'],
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

export const spec = schemaOrgLearningResource;
export const LearningResource = schemaOrgLearningResource;

export default schemaOrgLearningResource;
