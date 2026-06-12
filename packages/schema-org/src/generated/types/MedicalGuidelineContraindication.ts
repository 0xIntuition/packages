import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalGuidelineContraindication = {
	id: 'schema:MedicalGuidelineContraindication',
	name: 'MedicalGuidelineContraindication',
	label: 'MedicalGuidelineContraindication',
	comment:
		'A guideline contraindication that designates a process as harmful and where quality of the data supporting the contraindication is sound.',
	subClassOf: ['MedicalGuideline', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalGuidelineContraindication;
export const MedicalGuidelineContraindication = schemaOrgMedicalGuidelineContraindication;

export default schemaOrgMedicalGuidelineContraindication;
