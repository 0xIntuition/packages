import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReportedDoseSchedule = {
	id: 'schema:ReportedDoseSchedule',
	name: 'ReportedDoseSchedule',
	label: 'ReportedDoseSchedule',
	comment: 'A patient-reported or observed dosing schedule for a drug or supplement.',
	subClassOf: ['DoseSchedule', 'MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReportedDoseSchedule;
export const ReportedDoseSchedule = schemaOrgReportedDoseSchedule;

export default schemaOrgReportedDoseSchedule;
