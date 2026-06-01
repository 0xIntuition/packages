import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDENonprofitType = {
	id: 'schema:DENonprofitType',
	name: 'DENonprofitType',
	label: 'DENonprofitType',
	comment:
		'DENonprofitType: Non-profit organization type originating from Germany in accordance with article 52 of the German fiscal code (Abgabenverordnung or AO).',
	subClassOf: ['NonprofitType', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDENonprofitType;
export const DENonprofitType = schemaOrgDENonprofitType;

export default schemaOrgDENonprofitType;
