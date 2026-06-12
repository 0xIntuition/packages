import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDataFeedItem = {
	id: 'schema:DataFeedItem',
	name: 'DataFeedItem',
	label: 'DataFeedItem',
	comment: 'A single item within a larger data feed.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:dateCreated',
			name: 'dateCreated',
			label: 'dateCreated',
			comment:
				'The date on which the CreativeWork was created or the item was added to a DataFeed.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:dateDeleted',
			name: 'dateDeleted',
			label: 'dateDeleted',
			comment: 'The datetime the item was removed from the DataFeed.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:dateModified',
			name: 'dateModified',
			label: 'dateModified',
			comment:
				"The date on which the CreativeWork was most recently modified or when the item's entry was modified within a DataFeed.",
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:item',
			name: 'item',
			label: 'item',
			comment:
				"An entity represented by an entry in a list or data feed (e.g. an 'artist' in a list of 'artists').",
			rangeIncludes: ['Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDataFeedItem;
export const DataFeedItem = schemaOrgDataFeedItem;

export default schemaOrgDataFeedItem;
