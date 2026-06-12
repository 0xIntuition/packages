import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalWebPage = {
	id: 'schema:MedicalWebPage',
	name: 'MedicalWebPage',
	label: 'MedicalWebPage',
	comment: 'A web page that provides medical information.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:aspect',
			name: 'aspect',
			label: 'aspect',
			comment:
				"An aspect of medical practice that is considered on the page, such as 'diagnosis', 'treatment', 'causes', 'prognosis', 'etiology', 'epidemiology', etc.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:medicalAudience',
			name: 'medicalAudience',
			label: 'medicalAudience',
			comment: 'Medical audience for page.',
			rangeIncludes: ['MedicalAudience', 'MedicalAudienceType'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalWebPage;
export const MedicalWebPage = schemaOrgMedicalWebPage;

export default schemaOrgMedicalWebPage;
