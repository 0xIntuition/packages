import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgArtery = {
	id: 'schema:Artery',
	name: 'Artery',
	label: 'Artery',
	comment: 'A type of blood vessel that specifically carries blood away from the heart.',
	subClassOf: ['Vessel', 'AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:arterialBranch',
			name: 'arterialBranch',
			label: 'arterialBranch',
			comment: 'The branches that comprise the arterial structure.',
			rangeIncludes: ['AnatomicalStructure'],
		},
		{
			id: 'schema:supplyTo',
			name: 'supplyTo',
			label: 'supplyTo',
			comment: 'The area to which the artery supplies blood.',
			rangeIncludes: ['AnatomicalStructure'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgArtery;
export const Artery = schemaOrgArtery;

export default schemaOrgArtery;
