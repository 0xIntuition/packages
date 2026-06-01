import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMovieTheater = {
	id: 'schema:MovieTheater',
	name: 'MovieTheater',
	label: 'MovieTheater',
	comment: 'A movie theater.',
	subClassOf: [
		'CivicStructure',
		'Place',
		'Thing',
		'EntertainmentBusiness',
		'LocalBusiness',
		'Organization',
	],
	properties: [
		{
			id: 'schema:screenCount',
			name: 'screenCount',
			label: 'screenCount',
			comment: 'The number of screens in the movie theater.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMovieTheater;
export const MovieTheater = schemaOrgMovieTheater;

export default schemaOrgMovieTheater;
