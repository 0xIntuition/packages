import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMolecularEntity = {
	id: 'schema:MolecularEntity',
	name: 'MolecularEntity',
	label: 'MolecularEntity',
	comment:
		'Any constitutionally or isotopically distinct atom, molecule, ion, ion pair, radical, radical ion, complex, conformer etc., identifiable as a separately distinguishable entity.',
	subClassOf: ['BioChemEntity', 'Thing'],
	properties: [
		{
			id: 'schema:chemicalRole',
			name: 'chemicalRole',
			label: 'chemicalRole',
			comment: 'A role played by the BioChemEntity within a chemical context.',
			rangeIncludes: ['DefinedTerm'],
		},
		{
			id: 'schema:inChI',
			name: 'inChI',
			label: 'inChI',
			comment:
				'Non-proprietary identifier for molecular entity that can be used in printed and electronic data sources thus enabling easier linking of diverse data compilations.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:inChIKey',
			name: 'inChIKey',
			label: 'inChIKey',
			comment: 'InChIKey is a hashed version of the full InChI (using the SHA-256 algorithm).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:iupacName',
			name: 'iupacName',
			label: 'iupacName',
			comment:
				'Systematic method of naming chemical compounds as recommended by the International Union of Pure and Applied Chemistry (IUPAC).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:molecularFormula',
			name: 'molecularFormula',
			label: 'molecularFormula',
			comment:
				'The empirical formula is the simplest whole number ratio of all the atoms in a molecule.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:molecularWeight',
			name: 'molecularWeight',
			label: 'molecularWeight',
			comment:
				"This is the molecular weight of the entity being described, not of the parent. Units should be included in the form '&lt;Number&gt; &lt;unit&gt;', for example '12 amu' or as '&lt;QuantitativeValue&gt;.",
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:monoisotopicMolecularWeight',
			name: 'monoisotopicMolecularWeight',
			label: 'monoisotopicMolecularWeight',
			comment:
				"The monoisotopic mass is the sum of the masses of the atoms in a molecule using the unbound, ground-state, rest mass of the principal (most abundant) isotope for each element instead of the isotopic average mass. Please include the units in the form '&lt;Number&gt; &lt;unit&gt;', for example '770.230488 g/mol' or as '&lt;QuantitativeValue&gt;.",
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:potentialUse',
			name: 'potentialUse',
			label: 'potentialUse',
			comment: 'Intended use of the BioChemEntity by humans.',
			rangeIncludes: ['DefinedTerm'],
		},
		{
			id: 'schema:smiles',
			name: 'smiles',
			label: 'smiles',
			comment:
				'A specification in form of a line notation for describing the structure of chemical species using short ASCII strings.  Double bond stereochemistry \\ indicators may need to be escaped in the string in formats where the backslash is an escape character.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMolecularEntity;
export const MolecularEntity = schemaOrgMolecularEntity;

export default schemaOrgMolecularEntity;
