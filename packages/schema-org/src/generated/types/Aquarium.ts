import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAquarium = {
	id: 'schema:Aquarium',
	name: 'Aquarium',
	label: 'Aquarium',
	comment: 'Aquarium.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAquarium;
export const Aquarium = schemaOrgAquarium;

export default schemaOrgAquarium;
