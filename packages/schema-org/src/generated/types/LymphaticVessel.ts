import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLymphaticVessel = {
	id: 'schema:LymphaticVessel',
	name: 'LymphaticVessel',
	label: 'LymphaticVessel',
	comment:
		'A type of blood vessel that specifically carries lymph fluid unidirectionally toward the heart.',
	subClassOf: ['Vessel', 'AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:originatesFrom',
			name: 'originatesFrom',
			label: 'originatesFrom',
			comment: 'The vasculature the lymphatic structure originates, or afferents, from.',
			rangeIncludes: ['Vessel'],
		},
		{
			id: 'schema:regionDrained',
			name: 'regionDrained',
			label: 'regionDrained',
			comment:
				'The anatomical or organ system drained by this vessel; generally refers to a specific part of an organ.',
			rangeIncludes: ['AnatomicalStructure', 'AnatomicalSystem'],
		},
		{
			id: 'schema:runsTo',
			name: 'runsTo',
			label: 'runsTo',
			comment: 'The vasculature the lymphatic structure runs, or efferents, to.',
			rangeIncludes: ['Vessel'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLymphaticVessel;
export const LymphaticVessel = schemaOrgLymphaticVessel;

export default schemaOrgLymphaticVessel;
