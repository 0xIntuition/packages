import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhysicalTherapy = {
	id: 'schema:PhysicalTherapy',
	name: 'PhysicalTherapy',
	label: 'PhysicalTherapy',
	comment:
		'A process of progressive physical care and rehabilitation aimed at improving a health condition.',
	subClassOf: [
		'MedicalTherapy',
		'TherapeuticProcedure',
		'MedicalProcedure',
		'MedicalEntity',
		'Thing',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhysicalTherapy;
export const PhysicalTherapy = schemaOrgPhysicalTherapy;

export default schemaOrgPhysicalTherapy;
