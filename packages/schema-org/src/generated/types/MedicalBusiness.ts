import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalBusiness = {
	id: 'schema:MedicalBusiness',
	name: 'MedicalBusiness',
	label: 'MedicalBusiness',
	comment:
		'A particular physical or virtual business of an organization for medical purposes. Examples of MedicalBusiness include different businesses run by health professionals.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalBusiness;
export const MedicalBusiness = schemaOrgMedicalBusiness;

export default schemaOrgMedicalBusiness;
