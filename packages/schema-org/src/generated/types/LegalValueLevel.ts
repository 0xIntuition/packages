import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLegalValueLevel = {
	id: 'schema:LegalValueLevel',
	name: 'LegalValueLevel',
	label: 'LegalValueLevel',
	comment: 'A list of possible levels for the legal validity of a legislation.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLegalValueLevel;
export const LegalValueLevel = schemaOrgLegalValueLevel;

export default schemaOrgLegalValueLevel;
