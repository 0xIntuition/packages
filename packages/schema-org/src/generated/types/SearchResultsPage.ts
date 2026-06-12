import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSearchResultsPage = {
	id: 'schema:SearchResultsPage',
	name: 'SearchResultsPage',
	label: 'SearchResultsPage',
	comment: 'Web page type: Search results page.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSearchResultsPage;
export const SearchResultsPage = schemaOrgSearchResultsPage;

export default schemaOrgSearchResultsPage;
