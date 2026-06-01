import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBook = {
	id: 'schema:Book',
	name: 'Book',
	label: 'Book',
	comment: 'A book.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:abridged',
			name: 'abridged',
			label: 'abridged',
			comment: 'Indicates whether the book is an abridged edition.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:bookEdition',
			name: 'bookEdition',
			label: 'bookEdition',
			comment: 'The edition of the book.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:bookFormat',
			name: 'bookFormat',
			label: 'bookFormat',
			comment: 'The format of the book.',
			rangeIncludes: ['BookFormatType'],
		},
		{
			id: 'schema:illustrator',
			name: 'illustrator',
			label: 'illustrator',
			comment: 'The illustrator of the book.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:isbn',
			name: 'isbn',
			label: 'isbn',
			comment: 'The ISBN of the book.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:numberOfPages',
			name: 'numberOfPages',
			label: 'numberOfPages',
			comment: 'The number of pages in the book.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBook;
export const Book = schemaOrgBook;

export default schemaOrgBook;
