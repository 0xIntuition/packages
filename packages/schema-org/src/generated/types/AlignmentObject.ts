import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAlignmentObject = {
	id: 'schema:AlignmentObject',
	name: 'AlignmentObject',
	label: 'AlignmentObject',
	comment:
		'An intangible item that describes an alignment between a learning resource and a node in an educational framework.\nShould not be used where the nature of the alignment can be described using a simple property, for example to express that a resource [[teaches]] or [[assesses]] a competency.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:alignmentType',
			name: 'alignmentType',
			label: 'alignmentType',
			comment:
				"A category of alignment between the learning resource and the framework node. Recommended values include: 'requires', 'textComplexity', 'readingLevel', and 'educationalSubject'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:educationalFramework',
			name: 'educationalFramework',
			label: 'educationalFramework',
			comment: 'The framework to which the resource being described is aligned.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:targetDescription',
			name: 'targetDescription',
			label: 'targetDescription',
			comment: 'The description of a node in an established educational framework.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:targetName',
			name: 'targetName',
			label: 'targetName',
			comment: 'The name of a node in an established educational framework.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:targetUrl',
			name: 'targetUrl',
			label: 'targetUrl',
			comment: 'The URL of a node in an established educational framework.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAlignmentObject;
export const AlignmentObject = schemaOrgAlignmentObject;

export default schemaOrgAlignmentObject;
