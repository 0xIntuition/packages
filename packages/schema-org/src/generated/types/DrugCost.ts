import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugCost = {
	id: 'schema:DrugCost',
	name: 'DrugCost',
	label: 'DrugCost',
	comment:
		"The cost per unit of a medical drug. Note that this type is not meant to represent the price in an offer of a drug for sale; see the Offer type for that. This type will typically be used to tag wholesale or average retail cost of a drug, or maximum reimbursable cost. Costs of medical drugs vary widely depending on how and where they are paid for, so while this type captures some of the variables, costs should be used with caution by consumers of this schema's markup.",
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:applicableLocation',
			name: 'applicableLocation',
			label: 'applicableLocation',
			comment: 'The location in which the status applies.',
			rangeIncludes: ['AdministrativeArea'],
		},
		{
			id: 'schema:costCategory',
			name: 'costCategory',
			label: 'costCategory',
			comment: 'The category of cost, such as wholesale, retail, reimbursement cap, etc.',
			rangeIncludes: ['DrugCostCategory'],
		},
		{
			id: 'schema:costCurrency',
			name: 'costCurrency',
			label: 'costCurrency',
			comment:
				'The currency (in 3-letter) of the drug cost. See: http://en.wikipedia.org/wiki/ISO_4217. ',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:costOrigin',
			name: 'costOrigin',
			label: 'costOrigin',
			comment:
				"Additional details to capture the origin of the cost data. For example, 'Medicare Part B'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:costPerUnit',
			name: 'costPerUnit',
			label: 'costPerUnit',
			comment: 'The cost per unit of the drug.',
			rangeIncludes: ['Number', 'QualitativeValue', 'Text'],
		},
		{
			id: 'schema:drugUnit',
			name: 'drugUnit',
			label: 'drugUnit',
			comment: "The unit in which the drug is measured, e.g. '5 mg tablet'.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugCost;
export const DrugCost = schemaOrgDrugCost;

export default schemaOrgDrugCost;
