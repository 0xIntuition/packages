import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCourseInstance = {
	id: 'schema:CourseInstance',
	name: 'CourseInstance',
	label: 'CourseInstance',
	comment:
		'An instance of a [[Course]] which is distinct from other instances because it is offered at a different time or location or through different media or modes of study or to a specific section of students.',
	subClassOf: ['Event', 'Thing'],
	properties: [
		{
			id: 'schema:courseMode',
			name: 'courseMode',
			label: 'courseMode',
			comment:
				'The medium or means of delivery of the course instance or the mode of study, either as a text label (e.g. "online", "onsite" or "blended"; "synchronous" or "asynchronous"; "full-time" or "part-time") or as a URL reference to a term from a controlled vocabulary (e.g. https://ceds.ed.gov/element/001311#Asynchronous).',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:courseSchedule',
			name: 'courseSchedule',
			label: 'courseSchedule',
			comment: 'Represents the length and pace of a course, expressed as a [[Schedule]].',
			rangeIncludes: ['Schedule'],
		},
		{
			id: 'schema:courseWorkload',
			name: 'courseWorkload',
			label: 'courseWorkload',
			comment:
				'The amount of work expected of students taking the course, often provided as a figure per week or per month, and may be broken down by type. For example, "2 hours of lectures, 1 hour of lab work and 3 hours of independent study per week".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:instructor',
			name: 'instructor',
			label: 'instructor',
			comment:
				'A person assigned to instruct or provide instructional assistance for the [[CourseInstance]].',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCourseInstance;
export const CourseInstance = schemaOrgCourseInstance;

export default schemaOrgCourseInstance;
