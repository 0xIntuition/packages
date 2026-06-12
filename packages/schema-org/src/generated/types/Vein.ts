import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVein = {
	id: 'schema:Vein',
	name: 'Vein',
	label: 'Vein',
	comment: 'A type of blood vessel that specifically carries blood to the heart.',
	subClassOf: ['Vessel', 'AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:drainsTo',
			name: 'drainsTo',
			label: 'drainsTo',
			comment: 'The vasculature that the vein drains into.',
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
			id: 'schema:tributary',
			name: 'tributary',
			label: 'tributary',
			comment:
				'The anatomical or organ system that the vein flows into; a larger structure that the vein connects to.',
			rangeIncludes: ['AnatomicalStructure'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVein;
export const Vein = schemaOrgVein;

export default schemaOrgVein;
