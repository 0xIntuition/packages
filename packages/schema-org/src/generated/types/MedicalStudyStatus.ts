import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalStudyStatus = {
	id: 'schema:MedicalStudyStatus',
	name: 'MedicalStudyStatus',
	label: 'MedicalStudyStatus',
	comment: 'The status of a medical study. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalStudyStatus;
export const MedicalStudyStatus = schemaOrgMedicalStudyStatus;

export default schemaOrgMedicalStudyStatus;
