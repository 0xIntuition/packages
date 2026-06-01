import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProtein = {
	id: 'schema:Protein',
	name: 'Protein',
	label: 'Protein',
	comment:
		'Protein is here used in its widest possible definition, as classes of amino acid based molecules. Amyloid-beta Protein in human (UniProt P05067), eukaryota (e.g. an OrthoDB group) or even a single molecule that one can point to are all of type :Protein. A protein can thus be a subclass of another protein, e.g. :Protein as a UniProt record can have multiple isoforms inside it which would also be :Protein. They can be imagined, synthetic, hypothetical or naturally occurring.',
	subClassOf: ['BioChemEntity', 'Thing'],
	properties: [
		{
			id: 'schema:hasBioPolymerSequence',
			name: 'hasBioPolymerSequence',
			label: 'hasBioPolymerSequence',
			comment:
				'A symbolic representation of a BioChemEntity. For example, a nucleotide sequence of a Gene or an amino acid sequence of a Protein.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProtein;
export const Protein = schemaOrgProtein;

export default schemaOrgProtein;
