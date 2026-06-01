import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhysicalExam = {
	id: 'schema:PhysicalExam',
	name: 'PhysicalExam',
	label: 'PhysicalExam',
	comment: 'A type of physical examination of a patient performed by a physician. ',
	subClassOf: [
		'MedicalEnumeration',
		'Enumeration',
		'Intangible',
		'Thing',
		'MedicalProcedure',
		'MedicalEntity',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhysicalExam;
export const PhysicalExam = schemaOrgPhysicalExam;

export default schemaOrgPhysicalExam;
