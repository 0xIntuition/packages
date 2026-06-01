import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalAudience = {
	id: 'schema:MedicalAudience',
	name: 'MedicalAudience',
	label: 'MedicalAudience',
	comment: 'Target audiences for medical web pages.',
	subClassOf: ['Audience', 'Intangible', 'Thing', 'PeopleAudience'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalAudience;
export const MedicalAudience = schemaOrgMedicalAudience;

export default schemaOrgMedicalAudience;
