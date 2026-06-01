import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgListItem = {
	id: 'schema:ListItem',
	name: 'ListItem',
	label: 'ListItem',
	comment: 'An list item, e.g. a step in a checklist or how-to description.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:item',
			name: 'item',
			label: 'item',
			comment:
				"An entity represented by an entry in a list or data feed (e.g. an 'artist' in a list of 'artists').",
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:nextItem',
			name: 'nextItem',
			label: 'nextItem',
			comment: 'A link to the ListItem that follows the current one.',
			rangeIncludes: ['ListItem'],
		},
		{
			id: 'schema:position',
			name: 'position',
			label: 'position',
			comment: 'The position of an item in a series or sequence of items.',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:previousItem',
			name: 'previousItem',
			label: 'previousItem',
			comment: 'A link to the ListItem that precedes the current one.',
			rangeIncludes: ['ListItem'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgListItem;
export const ListItem = schemaOrgListItem;

export default schemaOrgListItem;
