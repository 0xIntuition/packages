import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNonprofitType = {
	id: 'schema:NonprofitType',
	name: 'NonprofitType',
	label: 'NonprofitType',
	comment:
		'NonprofitType enumerates several kinds of official non-profit types of which a non-profit organization can be.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNonprofitType;
export const NonprofitType = schemaOrgNonprofitType;

export default schemaOrgNonprofitType;
