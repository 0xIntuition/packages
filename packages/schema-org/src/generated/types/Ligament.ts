import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLigament = {
	id: 'schema:Ligament',
	name: 'Ligament',
	label: 'Ligament',
	comment:
		'A short band of tough, flexible, fibrous connective tissue that functions to connect multiple bones, cartilages, and structurally support joints.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLigament;
export const Ligament = schemaOrgLigament;

export default schemaOrgLigament;
