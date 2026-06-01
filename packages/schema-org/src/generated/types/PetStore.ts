import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPetStore = {
	id: 'schema:PetStore',
	name: 'PetStore',
	label: 'PetStore',
	comment: 'A pet store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPetStore;
export const PetStore = schemaOrgPetStore;

export default schemaOrgPetStore;
