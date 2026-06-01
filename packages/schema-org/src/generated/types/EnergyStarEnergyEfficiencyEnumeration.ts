import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEnergyStarEnergyEfficiencyEnumeration = {
	id: 'schema:EnergyStarEnergyEfficiencyEnumeration',
	name: 'EnergyStarEnergyEfficiencyEnumeration',
	label: 'EnergyStarEnergyEfficiencyEnumeration',
	comment: 'Used to indicate whether a product is EnergyStar certified.',
	subClassOf: ['EnergyEfficiencyEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEnergyStarEnergyEfficiencyEnumeration;
export const EnergyStarEnergyEfficiencyEnumeration = schemaOrgEnergyStarEnergyEfficiencyEnumeration;

export default schemaOrgEnergyStarEnergyEfficiencyEnumeration;
