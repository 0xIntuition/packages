import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthPlanFormulary = {
	id: 'schema:HealthPlanFormulary',
	name: 'HealthPlanFormulary',
	label: 'HealthPlanFormulary',
	comment:
		'For a given health insurance plan, the specification for costs and coverage of prescription drugs.',
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
			id: 'schema:healthPlanDrugTier',
			name: 'healthPlanDrugTier',
			label: 'healthPlanDrugTier',
			comment: 'The tier(s) of drugs offered by this formulary or insurance plan.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:offersPrescriptionByMail',
			name: 'offersPrescriptionByMail',
			label: 'offersPrescriptionByMail',
			comment: 'Whether prescriptions can be delivered by mail.',
			rangeIncludes: ['Boolean'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthPlanFormulary;
export const HealthPlanFormulary = schemaOrgHealthPlanFormulary;

export default schemaOrgHealthPlanFormulary;
