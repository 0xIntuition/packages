import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgChemicalSubstance = {
	id: 'schema:ChemicalSubstance',
	name: 'ChemicalSubstance',
	label: 'ChemicalSubstance',
	comment:
		"A chemical substance is 'a portion of matter of constant composition, composed of molecular entities of the same type or of different types' (source: [ChEBI:59999](https://www.ebi.ac.uk/chebi/searchId.do?chebiId=59999)).",
	subClassOf: ['BioChemEntity', 'Thing'],
	properties: [
		{
			id: 'schema:chemicalComposition',
			name: 'chemicalComposition',
			label: 'chemicalComposition',
			comment:
				'The chemical composition describes the identity and relative ratio of the chemical elements that make up the substance.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:chemicalRole',
			name: 'chemicalRole',
			label: 'chemicalRole',
			comment: 'A role played by the BioChemEntity within a chemical context.',
			rangeIncludes: ['DefinedTerm'],
		},
		{
			id: 'schema:potentialUse',
			name: 'potentialUse',
			label: 'potentialUse',
			comment: 'Intended use of the BioChemEntity by humans.',
			rangeIncludes: ['DefinedTerm'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgChemicalSubstance;
export const ChemicalSubstance = schemaOrgChemicalSubstance;

export default schemaOrgChemicalSubstance;
