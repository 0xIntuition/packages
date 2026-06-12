import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBookSeries = {
	id: 'schema:BookSeries',
	name: 'BookSeries',
	label: 'BookSeries',
	comment: 'A series of books. Included books can be indicated with the hasPart property.',
	subClassOf: ['CreativeWorkSeries', 'CreativeWork', 'Series', 'Thing', 'Intangible'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBookSeries;
export const BookSeries = schemaOrgBookSeries;

export default schemaOrgBookSeries;
