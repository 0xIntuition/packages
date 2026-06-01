import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthPlanNetwork = {
	id: 'schema:HealthPlanNetwork',
	name: 'HealthPlanNetwork',
	label: 'HealthPlanNetwork',
	comment: 'A US-style health insurance plan network.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:healthPlanCostSharing',
			name: 'healthPlanCostSharing',
			label: 'healthPlanCostSharing',
			comment: 'The costs to the patient for services under this network or formulary.',
			rangeIncludes: ['Boolean', 'HealthPlanCostSharingSpecification'],
		},
		{
			id: 'schema:healthPlanNetworkId',
			name: 'healthPlanNetworkId',
			label: 'healthPlanNetworkId',
			comment:
				'Name or unique ID of network. (Networks are often reused across different insurance plans.)',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:healthPlanNetworkTier',
			name: 'healthPlanNetworkTier',
			label: 'healthPlanNetworkTier',
			comment: 'The tier(s) for this network.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthPlanNetwork;
export const HealthPlanNetwork = schemaOrgHealthPlanNetwork;

export default schemaOrgHealthPlanNetwork;
