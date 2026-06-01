import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToDirection = {
	id: 'schema:HowToDirection',
	name: 'HowToDirection',
	label: 'HowToDirection',
	comment:
		'A direction indicating a single action to do in the instructions for how to achieve a result.',
	subClassOf: ['CreativeWork', 'Thing', 'ListItem', 'Intangible'],
	properties: [
		{
			id: 'schema:afterMedia',
			name: 'afterMedia',
			label: 'afterMedia',
			comment: 'A media object representing the circumstances after performing this direction.',
			rangeIncludes: ['MediaObject', 'URL'],
		},
		{
			id: 'schema:beforeMedia',
			name: 'beforeMedia',
			label: 'beforeMedia',
			comment: 'A media object representing the circumstances before performing this direction.',
			rangeIncludes: ['MediaObject', 'URL'],
		},
		{
			id: 'schema:duringMedia',
			name: 'duringMedia',
			label: 'duringMedia',
			comment: 'A media object representing the circumstances while performing this direction.',
			rangeIncludes: ['MediaObject', 'URL'],
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
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToDirection;
export const HowToDirection = schemaOrgHowToDirection;

export default schemaOrgHowToDirection;
