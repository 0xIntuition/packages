import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEducationalOccupationalCredential = {
	id: 'schema:EducationalOccupationalCredential',
	name: 'EducationalOccupationalCredential',
	label: 'EducationalOccupationalCredential',
	comment:
		'An educational or occupational credential. A diploma, academic degree, certification, qualification, badge, etc., that may be awarded to a person or other entity that meets the requirements defined by the credentialer.',
	subClassOf: ['Credential', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:competencyRequired',
			name: 'competencyRequired',
			label: 'competencyRequired',
			comment:
				'Knowledge, skill, ability or personal attribute that must be demonstrated by a person or other entity in order to do something such as earn an Educational Occupational Credential or understand a LearningResource.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:educationalLevel',
			name: 'educationalLevel',
			label: 'educationalLevel',
			comment:
				"The level in terms of progression through an educational or training context. Examples of educational levels include 'beginner', 'intermediate' or 'advanced', and formal sets of level indicators.",
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEducationalOccupationalCredential;
export const EducationalOccupationalCredential = schemaOrgEducationalOccupationalCredential;

export default schemaOrgEducationalOccupationalCredential;
