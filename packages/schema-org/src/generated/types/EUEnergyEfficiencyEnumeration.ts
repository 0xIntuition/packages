import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEUEnergyEfficiencyEnumeration = {
	id: 'schema:EUEnergyEfficiencyEnumeration',
	name: 'EUEnergyEfficiencyEnumeration',
	label: 'EUEnergyEfficiencyEnumeration',
	comment:
		'Enumerates the EU energy efficiency classes A-G as well as A+, A++, and A+++ as defined in EU directive 2017/1369.',
	subClassOf: ['EnergyEfficiencyEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEUEnergyEfficiencyEnumeration;
export const EUEnergyEfficiencyEnumeration = schemaOrgEUEnergyEfficiencyEnumeration;

export default schemaOrgEUEnergyEfficiencyEnumeration;
