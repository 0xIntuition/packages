import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBloodTest = {
	id: 'schema:BloodTest',
	name: 'BloodTest',
	label: 'BloodTest',
	comment: "A medical test performed on a sample of a patient's blood.",
	subClassOf: ['MedicalTest', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBloodTest;
export const BloodTest = schemaOrgBloodTest;

export default schemaOrgBloodTest;
