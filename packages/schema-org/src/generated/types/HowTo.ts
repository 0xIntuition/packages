import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowTo = {
	id: 'schema:HowTo',
	name: 'HowTo',
	label: 'HowTo',
	comment: 'Instructions that explain how to achieve a result by performing a sequence of steps.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:estimatedCost',
			name: 'estimatedCost',
			label: 'estimatedCost',
			comment:
				'The estimated cost of the supply or supplies consumed when performing instructions.',
			rangeIncludes: ['MonetaryAmount', 'Text'],
		},
		{
			id: 'schema:performTime',
			name: 'performTime',
			label: 'performTime',
			comment:
				'The length of time it takes to perform instructions or a direction (not including time to prepare the supplies), in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:prepTime',
			name: 'prepTime',
			label: 'prepTime',
			comment:
				'The length of time it takes to prepare the items to be used in instructions or a direction, in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:step',
			name: 'step',
			label: 'step',
			comment: 'A single step item (as HowToStep, text, document, video, etc.) or a HowToSection.',
			rangeIncludes: ['CreativeWork', 'HowToSection', 'HowToStep', 'Text'],
		},
		{
			id: 'schema:steps',
			name: 'steps',
			label: 'steps',
			comment:
				"A single step item (as HowToStep, text, document, video, etc.) or a HowToSection (originally misnamed 'steps'; 'step' is preferred).",
			rangeIncludes: ['CreativeWork', 'ItemList', 'Text'],
		},
		{
			id: 'schema:supply',
			name: 'supply',
			label: 'supply',
			comment:
				'A sub-property of instrument. A supply consumed when performing instructions or a direction.',
			rangeIncludes: ['HowToSupply', 'Text'],
		},
		{
			id: 'schema:tool',
			name: 'tool',
			label: 'tool',
			comment:
				'A sub property of instrument. An object used (but not consumed) when performing instructions or a direction.',
			rangeIncludes: ['HowToTool', 'Text'],
		},
		{
			id: 'schema:totalTime',
			name: 'totalTime',
			label: 'totalTime',
			comment:
				'The total time required to perform instructions or a direction (including time to prepare the supplies), in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:yield',
			name: 'yield',
			label: 'yield',
			comment:
				'The quantity that results by performing instructions. For example, a paper airplane, 10 personalized candles.',
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowTo;
export const HowTo = schemaOrgHowTo;

export default schemaOrgHowTo;
