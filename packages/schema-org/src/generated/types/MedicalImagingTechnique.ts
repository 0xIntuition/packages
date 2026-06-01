import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalImagingTechnique = {
	id: 'schema:MedicalImagingTechnique',
	name: 'MedicalImagingTechnique',
	label: 'MedicalImagingTechnique',
	comment: 'Any medical imaging modality typically used for diagnostic purposes. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalImagingTechnique;
export const MedicalImagingTechnique = schemaOrgMedicalImagingTechnique;

export default schemaOrgMedicalImagingTechnique;
