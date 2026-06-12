import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgITNonprofitType = {
	id: 'schema:ITNonprofitType',
	name: 'ITNonprofitType',
	label: 'ITNonprofitType',
	comment: 'ITNonprofitType: Non-profit organization type originating from Italy.',
	subClassOf: ['NonprofitType', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgITNonprofitType;
export const ITNonprofitType = schemaOrgITNonprofitType;

export default schemaOrgITNonprofitType;
