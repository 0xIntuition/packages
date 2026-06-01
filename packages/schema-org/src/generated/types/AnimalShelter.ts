import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAnimalShelter = {
	id: 'schema:AnimalShelter',
	name: 'AnimalShelter',
	label: 'AnimalShelter',
	comment: 'Animal shelter.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAnimalShelter;
export const AnimalShelter = schemaOrgAnimalShelter;

export default schemaOrgAnimalShelter;
