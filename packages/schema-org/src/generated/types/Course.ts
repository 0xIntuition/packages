import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCourse = {
	id: 'schema:Course',
	name: 'Course',
	label: 'Course',
	comment:
		'A description of an educational course which may be offered as distinct instances which take place at different times or take place at different locations, or be offered through different media or modes of study. An educational course is a sequence of one or more educational events and/or creative works which aims to build knowledge, competence or ability of learners.',
	subClassOf: ['CreativeWork', 'Thing', 'LearningResource'],
	properties: [
		{
			id: 'schema:availableLanguage',
			name: 'availableLanguage',
			label: 'availableLanguage',
			comment:
				'A language someone may use with or at the item, service or place. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[inLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:courseCode',
			name: 'courseCode',
			label: 'courseCode',
			comment:
				'The identifier for the [[Course]] used by the course [[provider]] (e.g. CS101 or 6.001).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:coursePrerequisites',
			name: 'coursePrerequisites',
			label: 'coursePrerequisites',
			comment:
				'Requirements for taking the Course. May be completion of another [[Course]] or a textual description like "permission of instructor". Requirements may be a pre-requisite competency, referenced using [[AlignmentObject]].',
			rangeIncludes: ['AlignmentObject', 'Course', 'Text'],
		},
		{
			id: 'schema:educationalCredentialAwarded',
			name: 'educationalCredentialAwarded',
			label: 'educationalCredentialAwarded',
			comment:
				'A description of the qualification, award, certificate, diploma or other educational credential awarded as a consequence of successful completion of this course or program.',
			rangeIncludes: ['EducationalOccupationalCredential', 'Text', 'URL'],
		},
		{
			id: 'schema:financialAidEligible',
			name: 'financialAidEligible',
			label: 'financialAidEligible',
			comment:
				'A financial aid type or program which students may use to pay for tuition or fees associated with the program.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:hasCourseInstance',
			name: 'hasCourseInstance',
			label: 'hasCourseInstance',
			comment:
				'An offering of the course at a specific time and place or through specific media or mode of study or to a specific section of students.',
			rangeIncludes: ['CourseInstance'],
		},
		{
			id: 'schema:numberOfCredits',
			name: 'numberOfCredits',
			label: 'numberOfCredits',
			comment:
				'The number of credits or units awarded by a Course or required to complete an EducationalOccupationalProgram.',
			rangeIncludes: ['Integer', 'StructuredValue'],
		},
		{
			id: 'schema:occupationalCredentialAwarded',
			name: 'occupationalCredentialAwarded',
			label: 'occupationalCredentialAwarded',
			comment:
				'A description of the qualification, award, certificate, diploma or other occupational credential awarded as a consequence of successful completion of this course or program.',
			rangeIncludes: ['EducationalOccupationalCredential', 'Text', 'URL'],
		},
		{
			id: 'schema:syllabusSections',
			name: 'syllabusSections',
			label: 'syllabusSections',
			comment:
				'Indicates (typically several) Syllabus entities that lay out what each section of the overall course will cover.',
			rangeIncludes: ['Syllabus'],
		},
		{
			id: 'schema:totalHistoricalEnrollment',
			name: 'totalHistoricalEnrollment',
			label: 'totalHistoricalEnrollment',
			comment: 'The total number of students that have enrolled in the history of the course.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCourse;
export const Course = schemaOrgCourse;

export default schemaOrgCourse;
