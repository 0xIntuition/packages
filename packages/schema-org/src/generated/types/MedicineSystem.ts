import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicineSystem = {
	id: 'schema:MedicineSystem',
	name: 'MedicineSystem',
	label: 'MedicineSystem',
	comment: 'Systems of medical practice.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicineSystem;
export const MedicineSystem = schemaOrgMedicineSystem;

export default schemaOrgMedicineSystem;
