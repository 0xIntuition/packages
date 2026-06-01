import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPathologyTest = {
	id: 'schema:PathologyTest',
	name: 'PathologyTest',
	label: 'PathologyTest',
	comment:
		'A medical test performed by a laboratory that typically involves examination of a tissue sample by a pathologist.',
	subClassOf: ['MedicalTest', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:tissueSample',
			name: 'tissueSample',
			label: 'tissueSample',
			comment: 'The type of tissue sample required for the test.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPathologyTest;
export const PathologyTest = schemaOrgPathologyTest;

export default schemaOrgPathologyTest;
