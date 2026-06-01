import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEnergyEfficiencyEnumeration = {
	id: 'schema:EnergyEfficiencyEnumeration',
	name: 'EnergyEfficiencyEnumeration',
	label: 'EnergyEfficiencyEnumeration',
	comment:
		'Enumerates energy efficiency levels (also known as "classes" or "ratings") and certifications that are part of several international energy efficiency standards.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEnergyEfficiencyEnumeration;
export const EnergyEfficiencyEnumeration = schemaOrgEnergyEfficiencyEnumeration;

export default schemaOrgEnergyEfficiencyEnumeration;
