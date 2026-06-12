import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgImagingTest = {
	id: 'schema:ImagingTest',
	name: 'ImagingTest',
	label: 'ImagingTest',
	comment: 'Any medical imaging modality typically used for diagnostic purposes.',
	subClassOf: ['MedicalTest', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:imagingTechnique',
			name: 'imagingTechnique',
			label: 'imagingTechnique',
			comment: 'Imaging technique used.',
			rangeIncludes: ['MedicalImagingTechnique'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgImagingTest;
export const ImagingTest = schemaOrgImagingTest;

export default schemaOrgImagingTest;
