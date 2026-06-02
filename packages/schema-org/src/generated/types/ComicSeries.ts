import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComicSeries = {
	id: 'schema:ComicSeries',
	name: 'ComicSeries',
	label: 'ComicSeries',
	comment:
		'A sequential publication of comic stories under a\n    \tunifying title, for example "The Amazing Spider-Man" or "Groo the\n    \tWanderer".',
	subClassOf: ['Periodical', 'CreativeWorkSeries', 'CreativeWork', 'Series', 'Thing', 'Intangible'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComicSeries;
export const ComicSeries = schemaOrgComicSeries;

export default schemaOrgComicSeries;
