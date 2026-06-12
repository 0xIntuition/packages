import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAggregateOffer = {
	id: 'schema:AggregateOffer',
	name: 'AggregateOffer',
	label: 'AggregateOffer',
	comment:
		'When a single product is associated with multiple offers (for example, the same pair of shoes is offered by different merchants), then AggregateOffer can be used.\\n\\nNote: AggregateOffers are normally expected to associate multiple offers that all share the same defined [[businessFunction]] value, or default to http://purl.org/goodrelations/v1#Sell if businessFunction is not explicitly defined.',
	subClassOf: ['Offer', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:highPrice',
			name: 'highPrice',
			label: 'highPrice',
			comment:
				"The highest price of all offers available.\\n\\nUsage guidelines:\\n\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:lowPrice',
			name: 'lowPrice',
			label: 'lowPrice',
			comment:
				"The lowest price of all offers available.\\n\\nUsage guidelines:\\n\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:offerCount',
			name: 'offerCount',
			label: 'offerCount',
			comment: 'The number of offers for the product.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:offers',
			name: 'offers',
			label: 'offers',
			comment:
				'An offer to provide this item&#x2014;for example, an offer to sell a product, rent the DVD of a movie, perform a service, or give away tickets to an event. Use [[businessFunction]] to indicate the kind of transaction offered, i.e. sell, lease, etc. This property can also be used to describe a [[Demand]]. While this property is listed as expected on a number of common types, it can be used in others. In that case, using a second type, such as Product or a subtype of Product, can clarify the nature of the offer.\n      ',
			rangeIncludes: ['Demand', 'Offer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAggregateOffer;
export const AggregateOffer = schemaOrgAggregateOffer;

export default schemaOrgAggregateOffer;
