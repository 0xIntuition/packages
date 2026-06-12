import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDataFeed = {
	id: 'schema:DataFeed',
	name: 'DataFeed',
	label: 'DataFeed',
	comment: 'A single feed providing structured information about one or more entities or topics.',
	subClassOf: ['Dataset', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:dataFeedElement',
			name: 'dataFeedElement',
			label: 'dataFeedElement',
			comment: 'An item within a data feed. Data feeds may have many elements.',
			rangeIncludes: ['DataFeedItem', 'Text', 'Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDataFeed;
export const DataFeed = schemaOrgDataFeed;

export default schemaOrgDataFeed;
