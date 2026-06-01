import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSeries = {
	id: 'schema:Series',
	name: 'Series',
	label: 'Series',
	comment:
		'A Series in schema.org is a group of related items, typically but not necessarily of the same kind. See also [[CreativeWorkSeries]], [[EventSeries]].',
	subClassOf: ['Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSeries;
export const Series = schemaOrgSeries;

export default schemaOrgSeries;
