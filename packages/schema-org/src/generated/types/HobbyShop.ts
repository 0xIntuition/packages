import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHobbyShop = {
	id: 'schema:HobbyShop',
	name: 'HobbyShop',
	label: 'HobbyShop',
	comment: 'A store that sells materials useful or necessary for various hobbies.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHobbyShop;
export const HobbyShop = schemaOrgHobbyShop;

export default schemaOrgHobbyShop;
