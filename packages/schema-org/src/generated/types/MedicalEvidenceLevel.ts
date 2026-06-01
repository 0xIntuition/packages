import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalEvidenceLevel = {
	id: 'schema:MedicalEvidenceLevel',
	name: 'MedicalEvidenceLevel',
	label: 'MedicalEvidenceLevel',
	comment: 'Level of evidence for a medical guideline. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalEvidenceLevel;
export const MedicalEvidenceLevel = schemaOrgMedicalEvidenceLevel;

export default schemaOrgMedicalEvidenceLevel;
