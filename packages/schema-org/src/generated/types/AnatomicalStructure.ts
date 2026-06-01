import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAnatomicalStructure = {
	id: 'schema:AnatomicalStructure',
	name: 'AnatomicalStructure',
	label: 'AnatomicalStructure',
	comment:
		'Any part of the human body, typically a component of an anatomical system. Organs, tissues, and cells are all anatomical structures.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:associatedPathophysiology',
			name: 'associatedPathophysiology',
			label: 'associatedPathophysiology',
			comment:
				'If applicable, a description of the pathophysiology associated with the anatomical system, including potential abnormal changes in the mechanical, physical, and biochemical functions of the system.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:bodyLocation',
			name: 'bodyLocation',
			label: 'bodyLocation',
			comment: 'Location in the body of the anatomical structure.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:connectedTo',
			name: 'connectedTo',
			label: 'connectedTo',
			comment: 'Other anatomical structures to which this structure is connected.',
			rangeIncludes: ['AnatomicalStructure'],
		},
		{
			id: 'schema:diagram',
			name: 'diagram',
			label: 'diagram',
			comment:
				'An image containing a diagram that illustrates the structure and/or its component substructures and/or connections with other structures.',
			rangeIncludes: ['ImageObject'],
		},
		{
			id: 'schema:partOfSystem',
			name: 'partOfSystem',
			label: 'partOfSystem',
			comment: 'The anatomical or organ system that this structure is part of.',
			rangeIncludes: ['AnatomicalSystem'],
		},
		{
			id: 'schema:relatedCondition',
			name: 'relatedCondition',
			label: 'relatedCondition',
			comment: 'A medical condition associated with this anatomy.',
			rangeIncludes: ['MedicalCondition'],
		},
		{
			id: 'schema:relatedTherapy',
			name: 'relatedTherapy',
			label: 'relatedTherapy',
			comment: 'A medical therapy related to this anatomy.',
			rangeIncludes: ['MedicalTherapy'],
		},
		{
			id: 'schema:subStructure',
			name: 'subStructure',
			label: 'subStructure',
			comment: 'Component (sub-)structure(s) that comprise this anatomical structure.',
			rangeIncludes: ['AnatomicalStructure'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAnatomicalStructure;
export const AnatomicalStructure = schemaOrgAnatomicalStructure;

export default schemaOrgAnatomicalStructure;
