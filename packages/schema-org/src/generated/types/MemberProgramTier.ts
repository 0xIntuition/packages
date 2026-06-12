import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMemberProgramTier = {
	id: 'schema:MemberProgramTier',
	name: 'MemberProgramTier',
	label: 'MemberProgramTier',
	comment:
		'A MemberProgramTier specifies a tier under a loyalty (member) program, for example "gold".',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:hasTierBenefit',
			name: 'hasTierBenefit',
			label: 'hasTierBenefit',
			comment: 'A member benefit for a particular tier of a loyalty program.',
			rangeIncludes: ['TierBenefitEnumeration'],
		},
		{
			id: 'schema:hasTierRequirement',
			name: 'hasTierRequirement',
			label: 'hasTierRequirement',
			comment:
				'A requirement for a user to join a membership tier, for example: a CreditCard if the tier requires sign up for a credit card, A UnitPriceSpecification if the user is required to pay a (periodic) fee, or a MonetaryAmount if the user needs to spend a minimum amount to join the tier. If a tier is free to join then this property does not need to be specified.',
			rangeIncludes: ['CreditCard', 'MonetaryAmount', 'Text', 'UnitPriceSpecification'],
		},
		{
			id: 'schema:isTierOf',
			name: 'isTierOf',
			label: 'isTierOf',
			comment: 'The member program this tier is a part of.',
			rangeIncludes: ['MemberProgram'],
		},
		{
			id: 'schema:membershipPointsEarned',
			name: 'membershipPointsEarned',
			label: 'membershipPointsEarned',
			comment:
				'The number of membership points earned by the member. If necessary, the unitText can be used to express the units the points are issued in. (E.g. stars, miles, etc.)',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMemberProgramTier;
export const MemberProgramTier = schemaOrgMemberProgramTier;

export default schemaOrgMemberProgramTier;
