import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUKNonprofitType = {
	id: 'schema:UKNonprofitType',
	name: 'UKNonprofitType',
	label: 'UKNonprofitType',
	comment: 'UKNonprofitType: Non-profit organization type originating from the United Kingdom.',
	subClassOf: ['NonprofitType', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUKNonprofitType;
export const UKNonprofitType = schemaOrgUKNonprofitType;

export default schemaOrgUKNonprofitType;
