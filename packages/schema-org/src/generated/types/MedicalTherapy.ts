import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalTherapy = {
	id: 'schema:MedicalTherapy',
	name: 'MedicalTherapy',
	label: 'MedicalTherapy',
	comment:
		'Any medical intervention designed to prevent, treat, and cure human diseases and medical conditions, including both curative and palliative therapies. Medical therapies are typically processes of care relying upon pharmacotherapy, behavioral therapy, supportive therapy (with fluid or nutrition for example), or detoxification (e.g. hemodialysis) aimed at improving or preventing a health condition.',
	subClassOf: ['TherapeuticProcedure', 'MedicalProcedure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:contraindication',
			name: 'contraindication',
			label: 'contraindication',
			comment: 'A contraindication for this therapy.',
			rangeIncludes: ['MedicalContraindication', 'Text'],
		},
		{
			id: 'schema:duplicateTherapy',
			name: 'duplicateTherapy',
			label: 'duplicateTherapy',
			comment: 'A therapy that duplicates or overlaps this one.',
			rangeIncludes: ['MedicalTherapy'],
		},
		{
			id: 'schema:seriousAdverseOutcome',
			name: 'seriousAdverseOutcome',
			label: 'seriousAdverseOutcome',
			comment:
				'A possible serious complication and/or serious side effect of this therapy. Serious adverse outcomes include those that are life-threatening; result in death, disability, or permanent damage; require hospitalization or prolong existing hospitalization; cause congenital anomalies or birth defects; or jeopardize the patient and may require medical or surgical intervention to prevent one of the outcomes in this definition.',
			rangeIncludes: ['MedicalEntity'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalTherapy;
export const MedicalTherapy = schemaOrgMedicalTherapy;

export default schemaOrgMedicalTherapy;
