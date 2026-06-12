import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGene = {
	id: 'schema:Gene',
	name: 'Gene',
	label: 'Gene',
	comment:
		'A discrete unit of inheritance which affects one or more biological traits (Source: [https://en.wikipedia.org/wiki/Gene](https://en.wikipedia.org/wiki/Gene)). Examples include FOXP2 (Forkhead box protein P2), SCARNA21 (small Cajal body-specific RNA 21), A- (agouti genotype).',
	subClassOf: ['BioChemEntity', 'Thing'],
	properties: [
		{
			id: 'schema:alternativeOf',
			name: 'alternativeOf',
			label: 'alternativeOf',
			comment: 'Another gene which is a variation of this one.',
			rangeIncludes: ['Gene'],
		},
		{
			id: 'schema:encodesBioChemEntity',
			name: 'encodesBioChemEntity',
			label: 'encodesBioChemEntity',
			comment: 'Another BioChemEntity encoded by this one. ',
			rangeIncludes: ['BioChemEntity'],
		},
		{
			id: 'schema:expressedIn',
			name: 'expressedIn',
			label: 'expressedIn',
			comment:
				'Tissue, organ, biological sample, etc in which activity of this gene has been observed experimentally. For example brain, digestive system.',
			rangeIncludes: ['AnatomicalStructure', 'AnatomicalSystem', 'BioChemEntity', 'DefinedTerm'],
		},
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

export const spec = schemaOrgGene;
export const Gene = schemaOrgGene;

export default schemaOrgGene;
