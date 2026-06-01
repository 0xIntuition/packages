import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMerchantReturnPolicy = {
	id: 'schema:MerchantReturnPolicy',
	name: 'MerchantReturnPolicy',
	label: 'MerchantReturnPolicy',
	comment:
		'A MerchantReturnPolicy provides information about product return policies associated with an [[Organization]], [[Product]], or [[Offer]].',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:additionalProperty',
			name: 'additionalProperty',
			label: 'additionalProperty',
			comment:
				'A property-value pair representing an additional characteristic of the entity, e.g. a product feature or another characteristic for which there is no matching property in schema.org.\\n\\nNote: Publishers should be aware that applications designed to use specific schema.org properties (e.g. https://schema.org/width, https://schema.org/color, https://schema.org/gtin13, ...) will typically expect such data to be provided using those properties, rather than using the generic property/value mechanism.\n',
			rangeIncludes: ['PropertyValue'],
		},
		{
			id: 'schema:applicableCountry',
			name: 'applicableCountry',
			label: 'applicableCountry',
			comment:
				'A country where a particular merchant return policy applies to, for example the two-letter ISO 3166-1 alpha-2 country code.',
			rangeIncludes: ['Country', 'Text'],
		},
		{
			id: 'schema:customerRemorseReturnFees',
			name: 'customerRemorseReturnFees',
			label: 'customerRemorseReturnFees',
			comment: 'The type of return fees if the product is returned due to customer remorse.',
			rangeIncludes: ['ReturnFeesEnumeration'],
		},
		{
			id: 'schema:customerRemorseReturnLabelSource',
			name: 'customerRemorseReturnLabelSource',
			label: 'customerRemorseReturnLabelSource',
			comment:
				'The method (from an enumeration) by which the customer obtains a return shipping label for a product returned due to customer remorse.',
			rangeIncludes: ['ReturnLabelSourceEnumeration'],
		},
		{
			id: 'schema:customerRemorseReturnShippingFeesAmount',
			name: 'customerRemorseReturnShippingFeesAmount',
			label: 'customerRemorseReturnShippingFeesAmount',
			comment:
				'The amount of shipping costs if a product is returned due to customer remorse. Applicable when property [[customerRemorseReturnFees]] equals [[ReturnShippingFees]].',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:inStoreReturnsOffered',
			name: 'inStoreReturnsOffered',
			label: 'inStoreReturnsOffered',
			comment:
				'Are in-store returns offered? (For more advanced return methods use the [[returnMethod]] property.)',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:itemCondition',
			name: 'itemCondition',
			label: 'itemCondition',
			comment:
				'A predefined value from OfferItemCondition specifying the condition of the product or service, or the products or services included in the offer. Also used for product return policies to specify the condition of products accepted for returns.',
			rangeIncludes: ['OfferItemCondition'],
		},
		{
			id: 'schema:itemDefectReturnFees',
			name: 'itemDefectReturnFees',
			label: 'itemDefectReturnFees',
			comment: 'The type of return fees for returns of defect products.',
			rangeIncludes: ['ReturnFeesEnumeration'],
		},
		{
			id: 'schema:itemDefectReturnLabelSource',
			name: 'itemDefectReturnLabelSource',
			label: 'itemDefectReturnLabelSource',
			comment:
				'The method (from an enumeration) by which the customer obtains a return shipping label for a defect product.',
			rangeIncludes: ['ReturnLabelSourceEnumeration'],
		},
		{
			id: 'schema:itemDefectReturnShippingFeesAmount',
			name: 'itemDefectReturnShippingFeesAmount',
			label: 'itemDefectReturnShippingFeesAmount',
			comment:
				'Amount of shipping costs for defect product returns. Applicable when property [[itemDefectReturnFees]] equals [[ReturnShippingFees]].',
			rangeIncludes: ['MonetaryAmount'],
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
			id: 'schema:merchantReturnLink',
			name: 'merchantReturnLink',
			label: 'merchantReturnLink',
			comment: 'Specifies a Web page or service by URL, for product returns.',
			rangeIncludes: ['URL'],
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
			id: 'schema:returnLabelSource',
			name: 'returnLabelSource',
			label: 'returnLabelSource',
			comment:
				'The method (from an enumeration) by which the customer obtains a return shipping label for a product returned for any reason.',
			rangeIncludes: ['ReturnLabelSourceEnumeration'],
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
			id: 'schema:returnPolicyCountry',
			name: 'returnPolicyCountry',
			label: 'returnPolicyCountry',
			comment:
				'The country where the product has to be sent to for returns, for example "Ireland" using the [[name]] property of [[Country]]. You can also provide the two-letter [ISO 3166-1 alpha-2 country code](http://en.wikipedia.org/wiki/ISO_3166-1). Note that this can be different from the country where the product was originally shipped from or sent to.',
			rangeIncludes: ['Country', 'Text'],
		},
		{
			id: 'schema:returnPolicySeasonalOverride',
			name: 'returnPolicySeasonalOverride',
			label: 'returnPolicySeasonalOverride',
			comment: 'Seasonal override of a return policy.',
			rangeIncludes: ['MerchantReturnPolicySeasonalOverride'],
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
			id: 'schema:validForMemberTier',
			name: 'validForMemberTier',
			label: 'validForMemberTier',
			comment:
				'The membership program tier(s) an Offer (or a PriceSpecification, OfferShippingDetails, or MerchantReturnPolicy under an Offer) is valid for.',
			rangeIncludes: ['MemberProgramTier'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMerchantReturnPolicy;
export const MerchantReturnPolicy = schemaOrgMerchantReturnPolicy;

export default schemaOrgMerchantReturnPolicy;
