import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalSpecialty = {
	id: 'schema:MedicalSpecialty',
	name: 'MedicalSpecialty',
	label: 'MedicalSpecialty',
	comment:
		'Any specific branch of medical science or practice. Medical specialities include clinical specialties that pertain to particular organ systems and their respective disease states, as well as allied health specialties. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing', 'Specialty'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalSpecialty;
export const MedicalSpecialty = schemaOrgMedicalSpecialty;

export default schemaOrgMedicalSpecialty;
