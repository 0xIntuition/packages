import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalGuideline = {
	id: 'schema:MedicalGuideline',
	name: 'MedicalGuideline',
	label: 'MedicalGuideline',
	comment:
		'Any recommendation made by a standard society (e.g. ACC/AHA) or consensus statement that denotes how to diagnose and treat a particular condition. Note: this type should be used to tag the actual guideline recommendation; if the guideline recommendation occurs in a larger scholarly article, use MedicalScholarlyArticle to tag the overall article, not this type. Note also: the organization making the recommendation should be captured in the recognizingAuthority base property of MedicalEntity.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:evidenceLevel',
			name: 'evidenceLevel',
			label: 'evidenceLevel',
			comment: 'Strength of evidence of the data used to formulate the guideline (enumerated).',
			rangeIncludes: ['MedicalEvidenceLevel'],
		},
		{
			id: 'schema:evidenceOrigin',
			name: 'evidenceOrigin',
			label: 'evidenceOrigin',
			comment:
				'Source of the data used to formulate the guidance, e.g. RCT, consensus opinion, etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:guidelineDate',
			name: 'guidelineDate',
			label: 'guidelineDate',
			comment: "Date on which this guideline's recommendation was made.",
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:guidelineSubject',
			name: 'guidelineSubject',
			label: 'guidelineSubject',
			comment: 'The medical conditions, treatments, etc. that are the subject of the guideline.',
			rangeIncludes: ['MedicalEntity'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalGuideline;
export const MedicalGuideline = schemaOrgMedicalGuideline;

export default schemaOrgMedicalGuideline;
