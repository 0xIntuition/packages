import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthPlanCostSharingSpecification = {
	id: 'schema:HealthPlanCostSharingSpecification',
	name: 'HealthPlanCostSharingSpecification',
	label: 'HealthPlanCostSharingSpecification',
	comment: 'A description of costs to the patient under a given network or formulary.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:healthPlanCoinsuranceOption',
			name: 'healthPlanCoinsuranceOption',
			label: 'healthPlanCoinsuranceOption',
			comment:
				'Whether the coinsurance applies before or after deductible, etc. TODO: Is this a closed set?',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:healthPlanCoinsuranceRate',
			name: 'healthPlanCoinsuranceRate',
			label: 'healthPlanCoinsuranceRate',
			comment: 'The rate of coinsurance expressed as a number between 0.0 and 1.0.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:healthPlanCopay',
			name: 'healthPlanCopay',
			label: 'healthPlanCopay',
			comment: 'The copay amount.',
			rangeIncludes: ['PriceSpecification'],
		},
		{
			id: 'schema:healthPlanCopayOption',
			name: 'healthPlanCopayOption',
			label: 'healthPlanCopayOption',
			comment: 'Whether the copay is before or after deductible, etc. TODO: Is this a closed set?',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:healthPlanPharmacyCategory',
			name: 'healthPlanPharmacyCategory',
			label: 'healthPlanPharmacyCategory',
			comment: 'The category or type of pharmacy associated with this cost sharing.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthPlanCostSharingSpecification;
export const HealthPlanCostSharingSpecification = schemaOrgHealthPlanCostSharingSpecification;

export default schemaOrgHealthPlanCostSharingSpecification;
