import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthInsurancePlan = {
	id: 'schema:HealthInsurancePlan',
	name: 'HealthInsurancePlan',
	label: 'HealthInsurancePlan',
	comment: 'A US-style health insurance plan, including PPOs, EPOs, and HMOs.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:benefitsSummaryUrl',
			name: 'benefitsSummaryUrl',
			label: 'benefitsSummaryUrl',
			comment:
				'The URL that goes directly to the summary of benefits and coverage for the specific standard plan or plan variation.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:contactPoint',
			name: 'contactPoint',
			label: 'contactPoint',
			comment: 'A contact point for a person or organization.',
			rangeIncludes: ['ContactPoint'],
		},
		{
			id: 'schema:healthPlanDrugOption',
			name: 'healthPlanDrugOption',
			label: 'healthPlanDrugOption',
			comment: 'TODO.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:healthPlanDrugTier',
			name: 'healthPlanDrugTier',
			label: 'healthPlanDrugTier',
			comment: 'The tier(s) of drugs offered by this formulary or insurance plan.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:healthPlanId',
			name: 'healthPlanId',
			label: 'healthPlanId',
			comment:
				'The 14-character, HIOS-generated Plan ID number. (Plan IDs must be unique, even across different markets.)',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:healthPlanMarketingUrl',
			name: 'healthPlanMarketingUrl',
			label: 'healthPlanMarketingUrl',
			comment:
				'The URL that goes directly to the plan brochure for the specific standard plan or plan variation.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:includesHealthPlanFormulary',
			name: 'includesHealthPlanFormulary',
			label: 'includesHealthPlanFormulary',
			comment: 'Formularies covered by this plan.',
			rangeIncludes: ['HealthPlanFormulary'],
		},
		{
			id: 'schema:includesHealthPlanNetwork',
			name: 'includesHealthPlanNetwork',
			label: 'includesHealthPlanNetwork',
			comment: 'Networks covered by this plan.',
			rangeIncludes: ['HealthPlanNetwork'],
		},
		{
			id: 'schema:usesHealthPlanIdStandard',
			name: 'usesHealthPlanIdStandard',
			label: 'usesHealthPlanIdStandard',
			comment:
				'The standard for interpreting the Plan ID. The preferred is "HIOS". See the Centers for Medicare & Medicaid Services for more details.',
			rangeIncludes: ['Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthInsurancePlan;
export const HealthInsurancePlan = schemaOrgHealthInsurancePlan;

export default schemaOrgHealthInsurancePlan;
