import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPalliativeProcedure = {
	id: 'schema:PalliativeProcedure',
	name: 'PalliativeProcedure',
	label: 'PalliativeProcedure',
	comment:
		'A medical procedure intended primarily for palliative purposes, aimed at relieving the symptoms of an underlying health condition.',
	subClassOf: [
		'MedicalProcedure',
		'MedicalEntity',
		'Thing',
		'MedicalTherapy',
		'TherapeuticProcedure',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPalliativeProcedure;
export const PalliativeProcedure = schemaOrgPalliativeProcedure;

export default schemaOrgPalliativeProcedure;
