import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRecommendedDoseSchedule = {
	id: 'schema:RecommendedDoseSchedule',
	name: 'RecommendedDoseSchedule',
	label: 'RecommendedDoseSchedule',
	comment:
		"A recommended dosing schedule for a drug or supplement as prescribed or recommended by an authority or by the drug/supplement's manufacturer. Capture the recommending authority in the recognizingAuthority property of MedicalEntity.",
	subClassOf: ['DoseSchedule', 'MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRecommendedDoseSchedule;
export const RecommendedDoseSchedule = schemaOrgRecommendedDoseSchedule;

export default schemaOrgRecommendedDoseSchedule;
