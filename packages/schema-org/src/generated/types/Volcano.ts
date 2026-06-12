import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVolcano = {
	id: 'schema:Volcano',
	name: 'Volcano',
	label: 'Volcano',
	comment: 'A volcano, like Fujisan.',
	subClassOf: ['Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVolcano;
export const Volcano = schemaOrgVolcano;

export default schemaOrgVolcano;
