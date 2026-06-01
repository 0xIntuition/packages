import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalTestPanel = {
	id: 'schema:MedicalTestPanel',
	name: 'MedicalTestPanel',
	label: 'MedicalTestPanel',
	comment: 'Any collection of tests commonly ordered together.',
	subClassOf: ['MedicalTest', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:subTest',
			name: 'subTest',
			label: 'subTest',
			comment: 'A component test of the panel.',
			rangeIncludes: ['MedicalTest'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalTestPanel;
export const MedicalTestPanel = schemaOrgMedicalTestPanel;

export default schemaOrgMedicalTestPanel;
