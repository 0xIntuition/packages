import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalEntity = {
	id: 'schema:MedicalEntity',
	name: 'MedicalEntity',
	label: 'MedicalEntity',
	comment: 'The most generic type of entity related to health and the practice of medicine.',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:code',
			name: 'code',
			label: 'code',
			comment:
				'A medical code for the entity, taken from a controlled vocabulary or ontology such as ICD-9, DiseasesDB, MeSH, SNOMED-CT, RxNorm, etc.',
			rangeIncludes: ['MedicalCode'],
		},
		{
			id: 'schema:funding',
			name: 'funding',
			label: 'funding',
			comment:
				'A [[Grant]] that directly or indirectly provide funding or sponsorship for this item. See also [[ownershipFundingInfo]].',
			rangeIncludes: ['Grant'],
		},
		{
			id: 'schema:guideline',
			name: 'guideline',
			label: 'guideline',
			comment: 'A medical guideline related to this entity.',
			rangeIncludes: ['MedicalGuideline'],
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
			id: 'schema:medicineSystem',
			name: 'medicineSystem',
			label: 'medicineSystem',
			comment:
				"The system of medicine that includes this MedicalEntity, for example 'evidence-based', 'homeopathic', 'chiropractic', etc.",
			rangeIncludes: ['MedicineSystem'],
		},
		{
			id: 'schema:recognizingAuthority',
			name: 'recognizingAuthority',
			label: 'recognizingAuthority',
			comment:
				'If applicable, the organization that officially recognizes this entity as part of its endorsed system of medicine.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:relevantSpecialty',
			name: 'relevantSpecialty',
			label: 'relevantSpecialty',
			comment: 'If applicable, a medical specialty in which this entity is relevant.',
			rangeIncludes: ['MedicalSpecialty'],
		},
		{
			id: 'schema:study',
			name: 'study',
			label: 'study',
			comment: 'A medical study or trial related to this entity.',
			rangeIncludes: ['MedicalStudy'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalEntity;
export const MedicalEntity = schemaOrgMedicalEntity;

export default schemaOrgMedicalEntity;
