import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMaximumDoseSchedule = {
	id: 'schema:MaximumDoseSchedule',
	name: 'MaximumDoseSchedule',
	label: 'MaximumDoseSchedule',
	comment:
		"The maximum dosing schedule considered safe for a drug or supplement as recommended by an authority or by the drug/supplement's manufacturer. Capture the recommending authority in the recognizingAuthority property of MedicalEntity.",
	subClassOf: ['DoseSchedule', 'MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMaximumDoseSchedule;
export const MaximumDoseSchedule = schemaOrgMaximumDoseSchedule;

export default schemaOrgMaximumDoseSchedule;
