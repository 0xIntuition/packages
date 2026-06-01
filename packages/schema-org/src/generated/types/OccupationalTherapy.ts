import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOccupationalTherapy = {
	id: 'schema:OccupationalTherapy',
	name: 'OccupationalTherapy',
	label: 'OccupationalTherapy',
	comment:
		'A treatment of people with physical, emotional, or social problems, using purposeful activity to help them overcome or learn to deal with their problems.',
	subClassOf: [
		'MedicalTherapy',
		'TherapeuticProcedure',
		'MedicalProcedure',
		'MedicalEntity',
		'Thing',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOccupationalTherapy;
export const OccupationalTherapy = schemaOrgOccupationalTherapy;

export default schemaOrgOccupationalTherapy;
