import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSpecialty = {
	id: 'schema:Specialty',
	name: 'Specialty',
	label: 'Specialty',
	comment:
		'Any branch of a field in which people typically develop specific expertise, usually after significant study, time, and effort.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSpecialty;
export const Specialty = schemaOrgSpecialty;

export default schemaOrgSpecialty;
