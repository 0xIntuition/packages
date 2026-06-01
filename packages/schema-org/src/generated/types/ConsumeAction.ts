import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConsumeAction = {
	id: 'schema:ConsumeAction',
	name: 'ConsumeAction',
	label: 'ConsumeAction',
	comment: 'The act of ingesting information/resources/food.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:actionAccessibilityRequirement',
			name: 'actionAccessibilityRequirement',
			label: 'actionAccessibilityRequirement',
			comment:
				'A set of requirements that must be fulfilled in order to perform an Action. If more than one value is specified, fulfilling one set of requirements will allow the Action to be performed.',
			rangeIncludes: ['ActionAccessSpecification'],
		},
		{
			id: 'schema:expectsAcceptanceOf',
			name: 'expectsAcceptanceOf',
			label: 'expectsAcceptanceOf',
			comment:
				'An Offer which must be accepted before the user can perform the Action. For example, the user may need to buy a movie before being able to watch it.',
			rangeIncludes: ['Offer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConsumeAction;
export const ConsumeAction = schemaOrgConsumeAction;

export default schemaOrgConsumeAction;
