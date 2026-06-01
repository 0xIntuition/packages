import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOfferForPurchase = {
	id: 'schema:OfferForPurchase',
	name: 'OfferForPurchase',
	label: 'OfferForPurchase',
	comment:
		'An [[OfferForPurchase]] in Schema.org represents an [[Offer]] to sell something, i.e. an [[Offer]] whose\n  [[businessFunction]] is [sell](http://purl.org/goodrelations/v1#Sell.). See [Good Relations](https://en.wikipedia.org/wiki/GoodRelations) for\n  background on the underlying concepts.\n  ',
	subClassOf: ['Offer', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOfferForPurchase;
export const OfferForPurchase = schemaOrgOfferForPurchase;

export default schemaOrgOfferForPurchase;
