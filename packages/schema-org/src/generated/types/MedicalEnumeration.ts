import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalEnumeration = {
	id: 'schema:MedicalEnumeration',
	name: 'MedicalEnumeration',
	label: 'MedicalEnumeration',
	comment:
		'Enumerations related to health and the practice of medicine: A concept that is used to attribute a quality to another concept, as a qualifier, a collection of items or a listing of all of the elements of a set in medicine practice.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalEnumeration;
export const MedicalEnumeration = schemaOrgMedicalEnumeration;

export default schemaOrgMedicalEnumeration;
