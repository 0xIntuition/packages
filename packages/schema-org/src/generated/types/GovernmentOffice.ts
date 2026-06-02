import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGovernmentOffice = {
	id: 'schema:GovernmentOffice',
	name: 'GovernmentOffice',
	label: 'GovernmentOffice',
	comment: 'A government office&#x2014;for example, an IRS or DMV office.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGovernmentOffice;
export const GovernmentOffice = schemaOrgGovernmentOffice;

export default schemaOrgGovernmentOffice;
