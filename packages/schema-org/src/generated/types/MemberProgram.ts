import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMemberProgram = {
	id: 'schema:MemberProgram',
	name: 'MemberProgram',
	label: 'MemberProgram',
	comment:
		'A MemberProgram defines a loyalty (or membership) program that provides its members with certain benefits, for example better pricing, free shipping or returns, or the ability to earn loyalty points. Member programs may have multiple tiers, for example silver and gold members, each with different benefits.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:hasTiers',
			name: 'hasTiers',
			label: 'hasTiers',
			comment: 'The tiers of a member program.',
			rangeIncludes: ['MemberProgramTier'],
		},
		{
			id: 'schema:hostingOrganization',
			name: 'hostingOrganization',
			label: 'hostingOrganization',
			comment:
				"The Organization (airline, travelers' club, retailer, etc.) the membership is made with or which offers the  MemberProgram.",
			rangeIncludes: ['Organization'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMemberProgram;
export const MemberProgram = schemaOrgMemberProgram;

export default schemaOrgMemberProgram;
