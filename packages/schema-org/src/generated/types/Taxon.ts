import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTaxon = {
	id: 'schema:Taxon',
	name: 'Taxon',
	label: 'Taxon',
	comment: 'A set of organisms asserted to represent a natural cohesive biological unit.',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:childTaxon',
			name: 'childTaxon',
			label: 'childTaxon',
			comment: 'Closest child taxa of the taxon in question.',
			rangeIncludes: ['Taxon', 'Text', 'URL'],
		},
		{
			id: 'schema:hasDefinedTerm',
			name: 'hasDefinedTerm',
			label: 'hasDefinedTerm',
			comment: 'A Defined Term contained in this term set.',
			rangeIncludes: ['DefinedTerm'],
		},
		{
			id: 'schema:parentTaxon',
			name: 'parentTaxon',
			label: 'parentTaxon',
			comment: 'Closest parent taxon of the taxon in question.',
			rangeIncludes: ['Taxon', 'Text', 'URL'],
		},
		{
			id: 'schema:taxonRank',
			name: 'taxonRank',
			label: 'taxonRank',
			comment:
				'The taxonomic rank of this taxon given preferably as a URI from a controlled vocabulary – typically the ranks from TDWG TaxonRank ontology or equivalent Wikidata URIs.',
			rangeIncludes: ['PropertyValue', 'Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTaxon;
export const Taxon = schemaOrgTaxon;

export default schemaOrgTaxon;
