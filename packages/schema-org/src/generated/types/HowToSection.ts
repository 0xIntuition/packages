import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToSection = {
	id: 'schema:HowToSection',
	name: 'HowToSection',
	label: 'HowToSection',
	comment:
		'A sub-grouping of steps in the instructions for how to achieve a result (e.g. steps for making a pie crust within a pie recipe).',
	subClassOf: ['CreativeWork', 'ItemList', 'ListItem', 'Thing', 'Intangible'],
	properties: [
		{
			id: 'schema:steps',
			name: 'steps',
			label: 'steps',
			comment:
				"A single step item (as HowToStep, text, document, video, etc.) or a HowToSection (originally misnamed 'steps'; 'step' is preferred).",
			rangeIncludes: ['CreativeWork', 'ItemList', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToSection;
export const HowToSection = schemaOrgHowToSection;

export default schemaOrgHowToSection;
