import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalTrialDesign = {
	id: 'schema:MedicalTrialDesign',
	name: 'MedicalTrialDesign',
	label: 'MedicalTrialDesign',
	comment: 'Design models for medical trials. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalTrialDesign;
export const MedicalTrialDesign = schemaOrgMedicalTrialDesign;

export default schemaOrgMedicalTrialDesign;
