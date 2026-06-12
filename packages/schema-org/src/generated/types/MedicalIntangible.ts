import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalIntangible = {
	id: 'schema:MedicalIntangible',
	name: 'MedicalIntangible',
	label: 'MedicalIntangible',
	comment:
		"A utility class that serves as the umbrella for a number of 'intangible' things in the medical space.",
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalIntangible;
export const MedicalIntangible = schemaOrgMedicalIntangible;

export default schemaOrgMedicalIntangible;
