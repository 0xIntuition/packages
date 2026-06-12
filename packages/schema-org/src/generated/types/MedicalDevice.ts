import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalDevice = {
	id: 'schema:MedicalDevice',
	name: 'MedicalDevice',
	label: 'MedicalDevice',
	comment: 'Any object used in a medical capacity, such as to diagnose or treat a patient.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:adverseOutcome',
			name: 'adverseOutcome',
			label: 'adverseOutcome',
			comment:
				'A possible complication and/or side effect of this therapy. If it is known that an adverse outcome is serious (resulting in death, disability, or permanent damage; requiring hospitalization; or otherwise life-threatening or requiring immediate medical attention), tag it as a seriousAdverseOutcome instead.',
			rangeIncludes: ['MedicalEntity'],
		},
		{
			id: 'schema:contraindication',
			name: 'contraindication',
			label: 'contraindication',
			comment: 'A contraindication for this therapy.',
			rangeIncludes: ['MedicalContraindication', 'Text'],
		},
		{
			id: 'schema:postOp',
			name: 'postOp',
			label: 'postOp',
			comment:
				'A description of the postoperative procedures, care, and/or followups for this device.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:preOp',
			name: 'preOp',
			label: 'preOp',
			comment:
				'A description of the workup, testing, and other preparations required before implanting this device.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:procedure',
			name: 'procedure',
			label: 'procedure',
			comment:
				'A description of the procedure involved in setting up, using, and/or installing the device.',
			rangeIncludes: ['Text'],
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

export const spec = schemaOrgMedicalDevice;
export const MedicalDevice = schemaOrgMedicalDevice;

export default schemaOrgMedicalDevice;
