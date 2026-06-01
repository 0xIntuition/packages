import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMerchantReturnPolicySeasonalOverride = {
	id: 'schema:MerchantReturnPolicySeasonalOverride',
	name: 'MerchantReturnPolicySeasonalOverride',
	label: 'MerchantReturnPolicySeasonalOverride',
	comment: 'A seasonal override of a return policy, for example used for holidays.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:merchantReturnDays',
			name: 'merchantReturnDays',
			label: 'merchantReturnDays',
			comment:
				'Specifies either a fixed return date or the number of days (from the delivery date) that a product can be returned. Used when the [[returnPolicyCategory]] property is specified as [[MerchantReturnFiniteReturnWindow]].',
			rangeIncludes: ['Date', 'DateTime', 'Integer'],
		},
		{
			id: 'schema:refundType',
			name: 'refundType',
			label: 'refundType',
			comment: 'A refund type, from an enumerated list.',
			rangeIncludes: ['RefundTypeEnumeration'],
		},
		{
			id: 'schema:restockingFee',
			name: 'restockingFee',
			label: 'restockingFee',
			comment:
				'Use [[MonetaryAmount]] to specify a fixed restocking fee for product returns, or use [[Number]] to specify a percentage of the product price paid by the customer.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
		{
			id: 'schema:returnFees',
			name: 'returnFees',
			label: 'returnFees',
			comment: 'The type of return fees for purchased products (for any return reason).',
			rangeIncludes: ['ReturnFeesEnumeration'],
		},
		{
			id: 'schema:returnMethod',
			name: 'returnMethod',
			label: 'returnMethod',
			comment: 'The type of return method offered, specified from an enumeration.',
			rangeIncludes: ['ReturnMethodEnumeration'],
		},
		{
			id: 'schema:returnPolicyCategory',
			name: 'returnPolicyCategory',
			label: 'returnPolicyCategory',
			comment: 'Specifies an applicable return policy (from an enumeration).',
			rangeIncludes: ['MerchantReturnEnumeration'],
		},
		{
			id: 'schema:returnShippingFeesAmount',
			name: 'returnShippingFeesAmount',
			label: 'returnShippingFeesAmount',
			comment:
				'Amount of shipping costs for product returns (for any reason). Applicable when property [[returnFees]] equals [[ReturnShippingFees]].',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMerchantReturnPolicySeasonalOverride;
export const MerchantReturnPolicySeasonalOverride = schemaOrgMerchantReturnPolicySeasonalOverride;

export default schemaOrgMerchantReturnPolicySeasonalOverride;
