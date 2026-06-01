import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBioChemEntity = {
	id: 'schema:BioChemEntity',
	name: 'BioChemEntity',
	label: 'BioChemEntity',
	comment:
		'Any biological, chemical, or biochemical thing. For example: a protein; a gene; a chemical; a synthetic chemical.',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:associatedDisease',
			name: 'associatedDisease',
			label: 'associatedDisease',
			comment:
				'Disease associated to this BioChemEntity. Such disease can be a MedicalCondition or a URL. If you want to add an evidence supporting the association, please use PropertyValue.',
			rangeIncludes: ['MedicalCondition', 'PropertyValue', 'URL'],
		},
		{
			id: 'schema:bioChemInteraction',
			name: 'bioChemInteraction',
			label: 'bioChemInteraction',
			comment: 'A BioChemEntity that is known to interact with this item.',
			rangeIncludes: ['BioChemEntity'],
		},
		{
			id: 'schema:bioChemSimilarity',
			name: 'bioChemSimilarity',
			label: 'bioChemSimilarity',
			comment: 'A similar BioChemEntity, e.g., obtained by fingerprint similarity algorithms.',
			rangeIncludes: ['BioChemEntity'],
		},
		{
			id: 'schema:biologicalRole',
			name: 'biologicalRole',
			label: 'biologicalRole',
			comment: 'A role played by the BioChemEntity within a biological context.',
			rangeIncludes: ['DefinedTerm'],
		},
		{
			id: 'schema:funding',
			name: 'funding',
			label: 'funding',
			comment:
				'A [[Grant]] that directly or indirectly provide funding or sponsorship for this item. See also [[ownershipFundingInfo]].',
			rangeIncludes: ['Grant'],
		},
		{
			id: 'schema:hasBioChemEntityPart',
			name: 'hasBioChemEntityPart',
			label: 'hasBioChemEntityPart',
			comment: 'Indicates a BioChemEntity that (in some sense) has this BioChemEntity as a part. ',
			rangeIncludes: ['BioChemEntity'],
		},
		{
			id: 'schema:hasMolecularFunction',
			name: 'hasMolecularFunction',
			label: 'hasMolecularFunction',
			comment:
				'Molecular function performed by this BioChemEntity; please use PropertyValue if you want to include any evidence.',
			rangeIncludes: ['DefinedTerm', 'PropertyValue', 'URL'],
		},
		{
			id: 'schema:hasRepresentation',
			name: 'hasRepresentation',
			label: 'hasRepresentation',
			comment:
				'A common representation such as a protein sequence or chemical structure for this entity. For images use schema.org/image.',
			rangeIncludes: ['PropertyValue', 'Text', 'URL'],
		},
		{
			id: 'schema:isEncodedByBioChemEntity',
			name: 'isEncodedByBioChemEntity',
			label: 'isEncodedByBioChemEntity',
			comment: 'Another BioChemEntity encoding by this one.',
			rangeIncludes: ['Gene'],
		},
		{
			id: 'schema:isInvolvedInBiologicalProcess',
			name: 'isInvolvedInBiologicalProcess',
			label: 'isInvolvedInBiologicalProcess',
			comment:
				'Biological process this BioChemEntity is involved in; please use PropertyValue if you want to include any evidence.',
			rangeIncludes: ['DefinedTerm', 'PropertyValue', 'URL'],
		},
		{
			id: 'schema:isLocatedInSubcellularLocation',
			name: 'isLocatedInSubcellularLocation',
			label: 'isLocatedInSubcellularLocation',
			comment:
				'Subcellular location where this BioChemEntity is located; please use PropertyValue if you want to include any evidence.',
			rangeIncludes: ['DefinedTerm', 'PropertyValue', 'URL'],
		},
		{
			id: 'schema:isPartOfBioChemEntity',
			name: 'isPartOfBioChemEntity',
			label: 'isPartOfBioChemEntity',
			comment: 'Indicates a BioChemEntity that is (in some sense) a part of this BioChemEntity. ',
			rangeIncludes: ['BioChemEntity'],
		},
		{
			id: 'schema:taxonomicRange',
			name: 'taxonomicRange',
			label: 'taxonomicRange',
			comment:
				'The taxonomic grouping of the organism that expresses, encodes, or in some way related to the BioChemEntity.',
			rangeIncludes: ['DefinedTerm', 'Taxon', 'Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBioChemEntity;
export const BioChemEntity = schemaOrgBioChemEntity;

export default schemaOrgBioChemEntity;
