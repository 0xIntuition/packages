import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLegalForceStatus = {
	id: 'schema:LegalForceStatus',
	name: 'LegalForceStatus',
	label: 'LegalForceStatus',
	comment: 'A list of possible statuses for the legal force of a legislation.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLegalForceStatus;
export const LegalForceStatus = schemaOrgLegalForceStatus;

export default schemaOrgLegalForceStatus;
