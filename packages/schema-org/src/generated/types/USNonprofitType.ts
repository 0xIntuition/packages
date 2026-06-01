import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUSNonprofitType = {
	id: 'schema:USNonprofitType',
	name: 'USNonprofitType',
	label: 'USNonprofitType',
	comment: 'USNonprofitType: Non-profit organization type originating from the United States.',
	subClassOf: ['NonprofitType', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUSNonprofitType;
export const USNonprofitType = schemaOrgUSNonprofitType;

export default schemaOrgUSNonprofitType;
