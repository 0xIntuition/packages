import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConstraintNode = {
	id: 'schema:ConstraintNode',
	name: 'ConstraintNode',
	label: 'ConstraintNode',
	comment:
		'The ConstraintNode type is provided to support usecases in which a node in a structured data graph is described with properties which appear to describe a single entity, but are being used in a situation where they serve a more abstract purpose. A [[ConstraintNode]] can be described using [[constraintProperty]] and [[numConstraints]]. These constraint properties can serve a\n    variety of purposes, and their values may sometimes be understood to indicate sets of possible values rather than single, exact and specific values.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:constraintProperty',
			name: 'constraintProperty',
			label: 'constraintProperty',
			comment:
				'Indicates a property used as a constraint. For example, in the definition of a [[StatisticalVariable]]. The value is a property, either from within Schema.org or from other compatible (e.g. RDF) systems such as DataCommons.org or Wikidata.org. ',
			rangeIncludes: ['Property', 'URL'],
		},
		{
			id: 'schema:numConstraints',
			name: 'numConstraints',
			label: 'numConstraints',
			comment:
				'Indicates the number of constraints property values defined for a particular [[ConstraintNode]] such as [[StatisticalVariable]]. This helps applications understand if they have access to a sufficiently complete description of a [[StatisticalVariable]] or other construct that is defined using properties on template-style nodes.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConstraintNode;
export const ConstraintNode = schemaOrgConstraintNode;

export default schemaOrgConstraintNode;
