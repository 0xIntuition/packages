import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVeterinaryCare = {
	id: 'schema:VeterinaryCare',
	name: 'VeterinaryCare',
	label: 'VeterinaryCare',
	comment: "A vet's office.",
	subClassOf: ['MedicalOrganization', 'Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVeterinaryCare;
export const VeterinaryCare = schemaOrgVeterinaryCare;

export default schemaOrgVeterinaryCare;
