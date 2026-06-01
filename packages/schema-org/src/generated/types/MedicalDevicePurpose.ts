import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalDevicePurpose = {
	id: 'schema:MedicalDevicePurpose',
	name: 'MedicalDevicePurpose',
	label: 'MedicalDevicePurpose',
	comment: 'Categories of medical devices, organized by the purpose or intended use of the device.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalDevicePurpose;
export const MedicalDevicePurpose = schemaOrgMedicalDevicePurpose;

export default schemaOrgMedicalDevicePurpose;
