import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBrainStructure = {
	id: 'schema:BrainStructure',
	name: 'BrainStructure',
	label: 'BrainStructure',
	comment:
		'Any anatomical structure which pertains to the soft nervous tissue functioning as the coordinating center of sensation and intellectual and nervous activity.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBrainStructure;
export const BrainStructure = schemaOrgBrainStructure;

export default schemaOrgBrainStructure;
