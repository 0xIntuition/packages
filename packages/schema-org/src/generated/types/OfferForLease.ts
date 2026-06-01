import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOfferForLease = {
	id: 'schema:OfferForLease',
	name: 'OfferForLease',
	label: 'OfferForLease',
	comment:
		'An [[OfferForLease]] in Schema.org represents an [[Offer]] to lease out something, i.e. an [[Offer]] whose\n  [[businessFunction]] is [lease out](http://purl.org/goodrelations/v1#LeaseOut.). See [Good Relations](https://en.wikipedia.org/wiki/GoodRelations) for\n  background on the underlying concepts.\n  ',
	subClassOf: ['Offer', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOfferForLease;
export const OfferForLease = schemaOrgOfferForLease;

export default schemaOrgOfferForLease;
