import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalObservationalStudyDesign = {
	id: 'schema:MedicalObservationalStudyDesign',
	name: 'MedicalObservationalStudyDesign',
	label: 'MedicalObservationalStudyDesign',
	comment: 'Design models for observational medical studies. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalObservationalStudyDesign;
export const MedicalObservationalStudyDesign = schemaOrgMedicalObservationalStudyDesign;

export default schemaOrgMedicalObservationalStudyDesign;
