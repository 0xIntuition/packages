import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAnatomicalSystem = {
	id: 'schema:AnatomicalSystem',
	name: 'AnatomicalSystem',
	label: 'AnatomicalSystem',
	comment:
		'An anatomical system is a group of anatomical structures that work together to perform a certain task. Anatomical systems, such as organ systems, are one organizing principle of anatomy, and can include circulatory, digestive, endocrine, integumentary, immune, lymphatic, muscular, nervous, reproductive, respiratory, skeletal, urinary, vestibular, and other systems.',
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
			id: 'schema:comprisedOf',
			name: 'comprisedOf',
			label: 'comprisedOf',
			comment:
				'Specifying something physically contained by something else. Typically used here for the underlying anatomical structures, such as organs, that comprise the anatomical system.',
			rangeIncludes: ['AnatomicalStructure', 'AnatomicalSystem'],
		},
		{
			id: 'schema:relatedCondition',
			name: 'relatedCondition',
			label: 'relatedCondition',
			comment: 'A medical condition associated with this anatomy.',
			rangeIncludes: ['MedicalCondition'],
		},
		{
			id: 'schema:relatedStructure',
			name: 'relatedStructure',
			label: 'relatedStructure',
			comment:
				'Related anatomical structure(s) that are not part of the system but relate or connect to it, such as vascular bundles associated with an organ system.',
			rangeIncludes: ['AnatomicalStructure'],
		},
		{
			id: 'schema:relatedTherapy',
			name: 'relatedTherapy',
			label: 'relatedTherapy',
			comment: 'A medical therapy related to this anatomy.',
			rangeIncludes: ['MedicalTherapy'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAnatomicalSystem;
export const AnatomicalSystem = schemaOrgAnatomicalSystem;

export default schemaOrgAnatomicalSystem;
