import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNerve = {
	id: 'schema:Nerve',
	name: 'Nerve',
	label: 'Nerve',
	comment:
		'A common pathway for the electrochemical nerve impulses that are transmitted along each of the axons.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:branch',
			name: 'branch',
			label: 'branch',
			comment:
				'The branches that delineate from the nerve bundle. Not to be confused with [[branchOf]].',
			rangeIncludes: ['AnatomicalStructure'],
		},
		{
			id: 'schema:nerveMotor',
			name: 'nerveMotor',
			label: 'nerveMotor',
			comment: 'The neurological pathway extension that involves muscle control.',
			rangeIncludes: ['Muscle'],
		},
		{
			id: 'schema:sensoryUnit',
			name: 'sensoryUnit',
			label: 'sensoryUnit',
			comment:
				'The neurological pathway extension that inputs and sends information to the brain or spinal cord.',
			rangeIncludes: ['AnatomicalStructure', 'SuperficialAnatomy'],
		},
		{
			id: 'schema:sourcedFrom',
			name: 'sourcedFrom',
			label: 'sourcedFrom',
			comment: 'The neurological pathway that originates the neurons.',
			rangeIncludes: ['BrainStructure'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNerve;
export const Nerve = schemaOrgNerve;

export default schemaOrgNerve;
