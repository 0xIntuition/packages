import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNLNonprofitType = {
	id: 'schema:NLNonprofitType',
	name: 'NLNonprofitType',
	label: 'NLNonprofitType',
	comment: 'NLNonprofitType: Non-profit organization type originating from the Netherlands.',
	subClassOf: ['NonprofitType', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNLNonprofitType;
export const NLNonprofitType = schemaOrgNLNonprofitType;

export default schemaOrgNLNonprofitType;
