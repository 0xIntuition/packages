import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgThing = {
	id: 'schema:Thing',
	name: 'Thing',
	label: 'Thing',
	comment: 'The most generic type of item.',
	subClassOf: [],
	properties: [
		{
			id: 'schema:additionalType',
			name: 'additionalType',
			label: 'additionalType',
			comment:
				'An additional type for the item, typically used for adding more specific types from external vocabularies in microdata syntax. This is a relationship between something and a class that the thing is in. Typically the value is a URI-identified RDF class, and in this case corresponds to the\n    use of rdf:type in RDF. Text values can be used sparingly, for cases where useful information can be added without their being an appropriate schema to reference. In the case of text values, the class label should follow the schema.org <a href="https://schema.org/docs/styleguide.html">style guide</a>.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:alternateName',
			name: 'alternateName',
			label: 'alternateName',
			comment: 'An alias for the item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:description',
			name: 'description',
			label: 'description',
			comment: 'A description of the item.',
			rangeIncludes: ['Text', 'TextObject'],
		},
		{
			id: 'schema:disambiguatingDescription',
			name: 'disambiguatingDescription',
			label: 'disambiguatingDescription',
			comment:
				'A sub property of description. A short description of the item used to disambiguate from other, similar items. Information from other properties (in particular, name) may be necessary for the description to be useful for disambiguation.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:identifier',
			name: 'identifier',
			label: 'identifier',
			comment:
				'The identifier property represents any kind of identifier for any kind of [[Thing]], such as ISBNs, GTIN codes, UUIDs etc. Schema.org provides dedicated properties for representing many of these, either as textual strings or as URL (URI) links. See [background notes](/docs/datamodel.html#identifierBg) for more details.\n        ',
			rangeIncludes: ['PropertyValue', 'Text', 'URL'],
		},
		{
			id: 'schema:image',
			name: 'image',
			label: 'image',
			comment: 'An image of the item. This can be a [[URL]] or a fully described [[ImageObject]].',
			rangeIncludes: ['ImageObject', 'URL'],
		},
		{
			id: 'schema:mainEntityOfPage',
			name: 'mainEntityOfPage',
			label: 'mainEntityOfPage',
			comment:
				'Indicates a page (or other CreativeWork) for which this thing is the main entity being described. See [background notes](/docs/datamodel.html#mainEntityBackground) for details.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:name',
			name: 'name',
			label: 'name',
			comment: 'The name of the item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:owner',
			name: 'owner',
			label: 'owner',
			comment: 'A person or organization who owns this Thing.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:potentialAction',
			name: 'potentialAction',
			label: 'potentialAction',
			comment:
				"Indicates a potential Action, which describes an idealized action in which this thing would play an 'object' role.",
			rangeIncludes: ['Action'],
		},
		{
			id: 'schema:sameAs',
			name: 'sameAs',
			label: 'sameAs',
			comment:
				"URL of a reference Web page that unambiguously indicates the item's identity. E.g. the URL of the item's Wikipedia page, Wikidata entry, or official website.",
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:subjectOf',
			name: 'subjectOf',
			label: 'subjectOf',
			comment: 'A CreativeWork or Event about this Thing.',
			rangeIncludes: ['CreativeWork', 'Event'],
		},
		{
			id: 'schema:url',
			name: 'url',
			label: 'url',
			comment: 'URL of the item.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgThing;
export const Thing = schemaOrgThing;

export default schemaOrgThing;
