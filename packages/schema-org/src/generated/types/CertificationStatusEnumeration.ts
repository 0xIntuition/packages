import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCertificationStatusEnumeration = {
	id: 'schema:CertificationStatusEnumeration',
	name: 'CertificationStatusEnumeration',
	label: 'CertificationStatusEnumeration',
	comment: 'Enumerates the different statuses of a Certification (Active and Inactive).',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCertificationStatusEnumeration;
export const CertificationStatusEnumeration = schemaOrgCertificationStatusEnumeration;

export default schemaOrgCertificationStatusEnumeration;
