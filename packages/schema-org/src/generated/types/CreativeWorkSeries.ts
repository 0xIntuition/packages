import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCreativeWorkSeries = {
	id: 'schema:CreativeWorkSeries',
	name: 'CreativeWorkSeries',
	label: 'CreativeWorkSeries',
	comment:
		'A CreativeWorkSeries in schema.org is a group of related items, typically but not necessarily of the same kind. CreativeWorkSeries are usually organized into some order, often chronological. Unlike [[ItemList]] which is a general purpose data structure for lists of things, the emphasis with CreativeWorkSeries is on published materials (written e.g. books and periodicals, or media such as TV, radio and games).\\n\\nSpecific subtypes are available for describing [[TVSeries]], [[RadioSeries]], [[MovieSeries]], [[BookSeries]], [[Periodical]] and [[VideoGameSeries]]. In each case, the [[hasPart]] / [[isPartOf]] properties can be used to relate the CreativeWorkSeries to its parts. The general CreativeWorkSeries type serves largely just to organize these more specific and practical subtypes.\\n\\nIt is common for properties applicable to an item from the series to be usefully applied to the containing group. Schema.org attempts to anticipate some of these cases, but publishers should be free to apply properties of the series parts to the series as a whole wherever they seem appropriate.\n    ',
	subClassOf: ['CreativeWork', 'Thing', 'Series', 'Intangible'],
	properties: [
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:issn',
			name: 'issn',
			label: 'issn',
			comment:
				'The International Standard Serial Number (ISSN) that identifies this serial publication. You can repeat this property to identify different formats of, or the linking ISSN (ISSN-L) for, this serial publication.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCreativeWorkSeries;
export const CreativeWorkSeries = schemaOrgCreativeWorkSeries;

export default schemaOrgCreativeWorkSeries;
