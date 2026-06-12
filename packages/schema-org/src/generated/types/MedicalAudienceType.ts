import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalAudienceType = {
	id: 'schema:MedicalAudienceType',
	name: 'MedicalAudienceType',
	label: 'MedicalAudienceType',
	comment: 'Target audiences types for medical web pages. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalAudienceType;
export const MedicalAudienceType = schemaOrgMedicalAudienceType;

export default schemaOrgMedicalAudienceType;
