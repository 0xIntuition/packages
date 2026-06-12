import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMuscle = {
	id: 'schema:Muscle',
	name: 'Muscle',
	label: 'Muscle',
	comment:
		'A muscle is an anatomical structure consisting of a contractile form of tissue that animals use to effect movement.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:antagonist',
			name: 'antagonist',
			label: 'antagonist',
			comment: 'The muscle whose action counteracts the specified muscle.',
			rangeIncludes: ['Muscle'],
		},
		{
			id: 'schema:bloodSupply',
			name: 'bloodSupply',
			label: 'bloodSupply',
			comment: 'The blood vessel that carries blood from the heart to the muscle.',
			rangeIncludes: ['Vessel'],
		},
		{
			id: 'schema:insertion',
			name: 'insertion',
			label: 'insertion',
			comment: 'The place of attachment of a muscle, or what the muscle moves.',
			rangeIncludes: ['AnatomicalStructure'],
		},
		{
			id: 'schema:muscleAction',
			name: 'muscleAction',
			label: 'muscleAction',
			comment: 'The movement the muscle generates.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:nerve',
			name: 'nerve',
			label: 'nerve',
			comment: 'The underlying innervation associated with the muscle.',
			rangeIncludes: ['Nerve'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMuscle;
export const Muscle = schemaOrgMuscle;

export default schemaOrgMuscle;
