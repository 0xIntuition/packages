import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrug = {
	id: 'schema:Drug',
	name: 'Drug',
	label: 'Drug',
	comment:
		'A chemical or biologic substance, used as a medical therapy, that has a physiological effect on an organism. Here the term drug is used interchangeably with the term medicine although clinical knowledge makes a clear difference between them.',
	subClassOf: ['Product', 'Substance', 'Thing', 'MedicalEntity'],
	properties: [
		{
			id: 'schema:activeIngredient',
			name: 'activeIngredient',
			label: 'activeIngredient',
			comment: 'An active ingredient, typically chemical compounds and/or biologic substances.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:administrationRoute',
			name: 'administrationRoute',
			label: 'administrationRoute',
			comment: "A route by which this drug may be administered, e.g. 'oral'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:alcoholWarning',
			name: 'alcoholWarning',
			label: 'alcoholWarning',
			comment:
				'Any precaution, guidance, contraindication, etc. related to consumption of alcohol while taking this drug.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:availableStrength',
			name: 'availableStrength',
			label: 'availableStrength',
			comment: 'An available dosage strength for the drug.',
			rangeIncludes: ['DrugStrength'],
		},
		{
			id: 'schema:breastfeedingWarning',
			name: 'breastfeedingWarning',
			label: 'breastfeedingWarning',
			comment:
				"Any precaution, guidance, contraindication, etc. related to this drug's use by breastfeeding mothers.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:clincalPharmacology',
			name: 'clincalPharmacology',
			label: 'clincalPharmacology',
			comment:
				'Description of the absorption and elimination of drugs, including their concentration (pharmacokinetics, pK) and biological effects (pharmacodynamics, pD).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:clinicalPharmacology',
			name: 'clinicalPharmacology',
			label: 'clinicalPharmacology',
			comment:
				'Description of the absorption and elimination of drugs, including their concentration (pharmacokinetics, pK) and biological effects (pharmacodynamics, pD).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:dosageForm',
			name: 'dosageForm',
			label: 'dosageForm',
			comment:
				"A dosage form in which this drug/supplement is available, e.g. 'tablet', 'suspension', 'injection'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:doseSchedule',
			name: 'doseSchedule',
			label: 'doseSchedule',
			comment:
				'A dosing schedule for the drug for a given population, either observed, recommended, or maximum dose based on the type used.',
			rangeIncludes: ['DoseSchedule'],
		},
		{
			id: 'schema:drugClass',
			name: 'drugClass',
			label: 'drugClass',
			comment: 'The class of drug this belongs to (e.g., statins).',
			rangeIncludes: ['DrugClass'],
		},
		{
			id: 'schema:drugUnit',
			name: 'drugUnit',
			label: 'drugUnit',
			comment: "The unit in which the drug is measured, e.g. '5 mg tablet'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:foodWarning',
			name: 'foodWarning',
			label: 'foodWarning',
			comment:
				'Any precaution, guidance, contraindication, etc. related to consumption of specific foods while taking this drug.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:includedInHealthInsurancePlan',
			name: 'includedInHealthInsurancePlan',
			label: 'includedInHealthInsurancePlan',
			comment: 'The insurance plans that cover this drug.',
			rangeIncludes: ['HealthInsurancePlan'],
		},
		{
			id: 'schema:interactingDrug',
			name: 'interactingDrug',
			label: 'interactingDrug',
			comment:
				'Another drug that is known to interact with this drug in a way that impacts the effect of this drug or causes a risk to the patient. Note: disease interactions are typically captured as contraindications.',
			rangeIncludes: ['Drug'],
		},
		{
			id: 'schema:isAvailableGenerically',
			name: 'isAvailableGenerically',
			label: 'isAvailableGenerically',
			comment: 'True if the drug is available in a generic form (regardless of name).',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:isProprietary',
			name: 'isProprietary',
			label: 'isProprietary',
			comment: "True if this item's name is a proprietary/brand name (vs. generic name).",
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:labelDetails',
			name: 'labelDetails',
			label: 'labelDetails',
			comment: "Link to the drug's label details.",
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:legalStatus',
			name: 'legalStatus',
			label: 'legalStatus',
			comment:
				"The drug or supplement's legal status, including any controlled substance schedules that apply.",
			rangeIncludes: ['DrugLegalStatus', 'MedicalEnumeration', 'Text'],
		},
		{
			id: 'schema:maximumIntake',
			name: 'maximumIntake',
			label: 'maximumIntake',
			comment:
				'Recommended intake of this supplement for a given population as defined by a specific recommending authority.',
			rangeIncludes: ['MaximumDoseSchedule'],
		},
		{
			id: 'schema:mechanismOfAction',
			name: 'mechanismOfAction',
			label: 'mechanismOfAction',
			comment:
				'The specific biochemical interaction through which this drug or supplement produces its pharmacological effect.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:nonProprietaryName',
			name: 'nonProprietaryName',
			label: 'nonProprietaryName',
			comment: 'The generic name of this drug or supplement.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:overdosage',
			name: 'overdosage',
			label: 'overdosage',
			comment:
				'Any information related to overdose on a drug, including signs or symptoms, treatments, contact information for emergency response.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:pregnancyCategory',
			name: 'pregnancyCategory',
			label: 'pregnancyCategory',
			comment: 'Pregnancy category of this drug.',
			rangeIncludes: ['DrugPregnancyCategory'],
		},
		{
			id: 'schema:pregnancyWarning',
			name: 'pregnancyWarning',
			label: 'pregnancyWarning',
			comment:
				"Any precaution, guidance, contraindication, etc. related to this drug's use during pregnancy.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:prescribingInfo',
			name: 'prescribingInfo',
			label: 'prescribingInfo',
			comment: 'Link to prescribing information for the drug.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:prescriptionStatus',
			name: 'prescriptionStatus',
			label: 'prescriptionStatus',
			comment:
				'Indicates the status of drug prescription, e.g. local catalogs classifications or whether the drug is available by prescription or over-the-counter, etc.',
			rangeIncludes: ['DrugPrescriptionStatus', 'Text'],
		},
		{
			id: 'schema:proprietaryName',
			name: 'proprietaryName',
			label: 'proprietaryName',
			comment: 'Proprietary name given to the diet plan, typically by its originator or creator.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:relatedDrug',
			name: 'relatedDrug',
			label: 'relatedDrug',
			comment: 'Any other drug related to this one, for example commonly-prescribed alternatives.',
			rangeIncludes: ['Drug'],
		},
		{
			id: 'schema:rxcui',
			name: 'rxcui',
			label: 'rxcui',
			comment: 'The RxCUI drug identifier from RXNORM.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:warning',
			name: 'warning',
			label: 'warning',
			comment: 'Any FDA or other warnings about the drug (text or URL).',
			rangeIncludes: ['Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrug;
export const Drug = schemaOrgDrug;

export default schemaOrgDrug;
