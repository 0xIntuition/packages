import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTierBenefitEnumeration = {
	id: 'schema:TierBenefitEnumeration',
	name: 'TierBenefitEnumeration',
	label: 'TierBenefitEnumeration',
	comment: 'An enumeration of possible benefits as part of a loyalty (members) program.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTierBenefitEnumeration;
export const TierBenefitEnumeration = schemaOrgTierBenefitEnumeration;

export default schemaOrgTierBenefitEnumeration;
