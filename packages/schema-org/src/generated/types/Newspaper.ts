import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNewspaper = {
	id: 'schema:Newspaper',
	name: 'Newspaper',
	label: 'Newspaper',
	comment:
		'A publication containing information about varied topics that are pertinent to general information, a geographic area, or a specific subject matter (i.e. business, culture, education). Often published daily.',
	subClassOf: ['Periodical', 'CreativeWorkSeries', 'CreativeWork', 'Thing', 'Series', 'Intangible'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNewspaper;
export const Newspaper = schemaOrgNewspaper;

export default schemaOrgNewspaper;
