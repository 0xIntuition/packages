import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOfferCatalog = {
	id: 'schema:OfferCatalog',
	name: 'OfferCatalog',
	label: 'OfferCatalog',
	comment:
		'An OfferCatalog is an ItemList that contains related Offers and/or further OfferCatalogs that are offeredBy the same provider.',
	subClassOf: ['ItemList', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOfferCatalog;
export const OfferCatalog = schemaOrgOfferCatalog;

export default schemaOrgOfferCatalog;
