import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadiationTherapy = {
	id: 'schema:RadiationTherapy',
	name: 'RadiationTherapy',
	label: 'RadiationTherapy',
	comment: 'A process of care using radiation aimed at improving a health condition.',
	subClassOf: [
		'MedicalTherapy',
		'TherapeuticProcedure',
		'MedicalProcedure',
		'MedicalEntity',
		'Thing',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadiationTherapy;
export const RadiationTherapy = schemaOrgRadiationTherapy;

export default schemaOrgRadiationTherapy;
