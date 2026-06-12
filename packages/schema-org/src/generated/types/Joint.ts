import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgJoint = {
	id: 'schema:Joint',
	name: 'Joint',
	label: 'Joint',
	comment: 'The anatomical location at which two or more bones make contact.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:biomechnicalClass',
			name: 'biomechnicalClass',
			label: 'biomechnicalClass',
			comment: 'The biomechanical properties of the bone.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:functionalClass',
			name: 'functionalClass',
			label: 'functionalClass',
			comment: 'The degree of mobility the joint allows.',
			rangeIncludes: ['MedicalEntity', 'Text'],
		},
		{
			id: 'schema:structuralClass',
			name: 'structuralClass',
			label: 'structuralClass',
			comment: 'The name given to how bone physically connects to each other.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgJoint;
export const Joint = schemaOrgJoint;

export default schemaOrgJoint;
