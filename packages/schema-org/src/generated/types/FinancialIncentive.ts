import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFinancialIncentive = {
	id: 'schema:FinancialIncentive',
	name: 'FinancialIncentive',
	label: 'FinancialIncentive',
	comment:
		'<p>Represents financial incentives for goods/services offered by an organization (or individual).</p>\n\n<p>Typically contains the [[name]] of the incentive, the [[incentivizedItem]], the [[incentiveAmount]], the [[incentiveStatus]], [[incentiveType]], the [[provider]] of the incentive, and [[eligibleWithSupplier]].</p>\n\n<p>Optionally contains criteria on whether the incentive is limited based on [[purchaseType]], [[purchasePriceLimit]], [[incomeLimit]], and the [[qualifiedExpense]].\n    ',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:areaServed',
			name: 'areaServed',
			label: 'areaServed',
			comment: 'The geographic area where a service or offered item is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:eligibleWithSupplier',
			name: 'eligibleWithSupplier',
			label: 'eligibleWithSupplier',
			comment:
				'The supplier of the incentivized item/service for which the incentive is valid for such as a utility company, merchant, or contractor.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:incentiveAmount',
			name: 'incentiveAmount',
			label: 'incentiveAmount',
			comment:
				'Describes the amount that can be redeemed from this incentive.\n    \n<p>[[QuantitativeValue]]: Use this for incentives based on price (either raw amount or percentage-based). For a raw amount example, "You can claim $2,500 - $7,500 from the total cost of installation" would be represented as the following:</p>\n    {\n        "@type": "QuantitativeValue",\n        “minValue”: 2500,\n        “maxValue”: 7500,\n        "unitCode": "USD"\n    }\n<p>[[QuantitativeValue]] can also be used for percentage amounts. In such cases, value is used to represent the incentive’s percentage, while maxValue represents a limit (if one exists) to that incentive. The unitCode should be \'P1\' and the unitText should be \'%\', while valueReference should be used for holding the currency type. For example, "You can claim up to 30% of the total cost of installation, up to a maximum of $7,500" would be:</p>\n    {\n        "@type": "QuantitativeValue",\n        "value": 30,\n        "unitCode": "P1",\n        "unitText": "%",\n        “maxValue”: 7500,\n        “valueReference”: “USD”\n    }\n<p>[[UnitPriceSpecification]]: Use this for incentives that are based on amounts rather than price. For example, a net metering rebate that pays $10/kWh, up to $1,000:</p>\n    {\n        "@type": "UnitPriceSpecification",\n        "price": 10,\n        "priceCurrency": "USD",\n        "referenceQuantity": 1,\n        "unitCode": "DO3",\n        "unitText": "kw/h",\n        "maxPrice": 1000,\n        "description": "$10 / kwh up to $1000"\n    }\n<p>[[LoanOrCredit]]: Use for incentives that are loan based. For example, a loan of $4,000 - $50,000 with a repayment term of 10 years, interest free would look like:</p>\n    {\n        "@type": "LoanOrCredit",\n        "loanTerm": {\n                "@type":"QuantitativeValue",\n                "value":"10",\n                "unitCode": "ANN"\n            },\n        "amount":[\n            {\n                "@type": "QuantitativeValue",\n                "Name":"fixed interest rate",\n                "value":"0",\n            },\n        ],\n        "amount":[\n            {\n                "@type": "MonetaryAmount",\n                "Name":"min loan amount",\n                "value":"4000",\n                "currency":"CAD"\n            },\n            {\n                "@type": "MonetaryAmount",\n                "Name":"max loan amount",\n                "value":"50000",\n                "currency":"CAD"\n            }\n        ],\n    }\n\nIn summary: <ul><li>Use [[QuantitativeValue]] for absolute/percentage-based incentives applied on the price of a good/service.</li>\n<li>Use [[UnitPriceSpecification]] for incentives based on a per-unit basis (e.g. net metering).</li>\n<li>Use [[LoanOrCredit]] for loans/credits.</li>\n</ul>.',
			rangeIncludes: ['LoanOrCredit', 'QuantitativeValue', 'UnitPriceSpecification'],
		},
		{
			id: 'schema:incentiveStatus',
			name: 'incentiveStatus',
			label: 'incentiveStatus',
			comment: 'The status of the incentive (active, on hold, retired, etc.).',
			rangeIncludes: ['IncentiveStatus'],
		},
		{
			id: 'schema:incentiveType',
			name: 'incentiveType',
			label: 'incentiveType',
			comment:
				'The type of incentive offered (tax credit/rebate, tax deduction, tax waiver, subsidies, etc.).',
			rangeIncludes: ['IncentiveType'],
		},
		{
			id: 'schema:incentivizedItem',
			name: 'incentivizedItem',
			label: 'incentivizedItem',
			comment:
				'The type or specific product(s) and/or service(s) being incentivized.\n<p>DefinedTermSets are used for product and service categories such as the United Nations Standard Products and Services Code:</p>\n    {\n        "@type": "DefinedTerm",\n        "inDefinedTermSet": "https://www.unspsc.org/",\n        "termCode": "261315XX",\n        "name": "Photovoltaic module"\n    }\n\n<p>For a specific product or service, use the Product type:</p>\n    {\n        "@type": "Product",\n        "name": "Kenmore White 17" Microwave",\n    }\nFor multiple different incentivized items, use multiple [[DefinedTerm]] or [[Product]].',
			rangeIncludes: ['DefinedTerm', 'Product'],
		},
		{
			id: 'schema:incomeLimit',
			name: 'incomeLimit',
			label: 'incomeLimit',
			comment:
				'Optional. Income limit for which the incentive is applicable for.\n    \n<p>If MonetaryAmount is specified, this should be based on annualized income (e.g. if an incentive is limited to those making <$114,000 annually):</p>\n    {\n        "@type": "MonetaryAmount",\n        "maxValue": 114000,\n        "currency": "USD",\n    }\n\nUse Text for incentives that are limited based on other criteria, for example if an incentive is only available to recipients making 120% of the median poverty income in their area.',
			rangeIncludes: ['MonetaryAmount', 'Text'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:publisher',
			name: 'publisher',
			label: 'publisher',
			comment: 'The publisher of the article in question.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:purchasePriceLimit',
			name: 'purchasePriceLimit',
			label: 'purchasePriceLimit',
			comment: 'Optional. The maximum price the item can have and still qualify for this offer.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:purchaseType',
			name: 'purchaseType',
			label: 'purchaseType',
			comment:
				'Optional. The type of purchase the consumer must make in order to qualify for this incentive.',
			rangeIncludes: ['PurchaseType'],
		},
		{
			id: 'schema:qualifiedExpense',
			name: 'qualifiedExpense',
			label: 'qualifiedExpense',
			comment:
				'Optional. The types of expenses that are covered by the incentive. For example some incentives are only for the goods (tangible items) but the services (labor) are excluded.',
			rangeIncludes: ['IncentiveQualifiedExpenseType'],
		},
		{
			id: 'schema:validFrom',
			name: 'validFrom',
			label: 'validFrom',
			comment: 'The date when the item becomes valid.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:validThrough',
			name: 'validThrough',
			label: 'validThrough',
			comment:
				'The date after when the item is not valid. For example the end of an offer, salary period, or a period of opening hours.',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFinancialIncentive;
export const FinancialIncentive = schemaOrgFinancialIncentive;

export default schemaOrgFinancialIncentive;
