import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugPrescriptionStatus = {
	id: 'schema:DrugPrescriptionStatus',
	name: 'DrugPrescriptionStatus',
	label: 'DrugPrescriptionStatus',
	comment: 'Indicates whether this drug is available by prescription or over-the-counter.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugPrescriptionStatus;
export const DrugPrescriptionStatus = schemaOrgDrugPrescriptionStatus;

export default schemaOrgDrugPrescriptionStatus;
