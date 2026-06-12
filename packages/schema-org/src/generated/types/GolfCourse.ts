import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGolfCourse = {
	id: 'schema:GolfCourse',
	name: 'GolfCourse',
	label: 'GolfCourse',
	comment: 'A golf course.',
	subClassOf: ['SportsActivityLocation', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGolfCourse;
export const GolfCourse = schemaOrgGolfCourse;

export default schemaOrgGolfCourse;
