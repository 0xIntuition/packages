import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmploymentAgency = {
	id: 'schema:EmploymentAgency',
	name: 'EmploymentAgency',
	label: 'EmploymentAgency',
	comment: 'An employment agency.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmploymentAgency;
export const EmploymentAgency = schemaOrgEmploymentAgency;

export default schemaOrgEmploymentAgency;
