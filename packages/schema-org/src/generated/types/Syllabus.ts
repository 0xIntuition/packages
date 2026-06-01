import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSyllabus = {
	id: 'schema:Syllabus',
	name: 'Syllabus',
	label: 'Syllabus',
	comment:
		'A syllabus that describes the material covered in a course, often with several such sections per [[Course]] so that a distinct [[timeRequired]] can be provided for that section of the [[Course]].',
	subClassOf: ['LearningResource', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSyllabus;
export const Syllabus = schemaOrgSyllabus;

export default schemaOrgSyllabus;
