import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBone = {
	id: 'schema:Bone',
	name: 'Bone',
	label: 'Bone',
	comment: 'Rigid connective tissue that comprises up the skeletal structure of the human body.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBone;
export const Bone = schemaOrgBone;

export default schemaOrgBone;
