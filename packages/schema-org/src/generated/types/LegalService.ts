import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLegalService = {
	id: 'schema:LegalService',
	name: 'LegalService',
	label: 'LegalService',
	comment:
		'A LegalService is a business that provides legally-oriented services, advice and representation, e.g. law firms.\\n\\nAs a [[LocalBusiness]] it can be described as a [[provider]] of one or more [[Service]]\\(s).',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLegalService;
export const LegalService = schemaOrgLegalService;

export default schemaOrgLegalService;
