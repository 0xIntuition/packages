import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProgramMembership = {
	id: 'schema:ProgramMembership',
	name: 'ProgramMembership',
	label: 'ProgramMembership',
	comment:
		'Used to describe membership in a loyalty programs (e.g. "StarAliance"), traveler clubs (e.g. "AAA"), purchase clubs ("Safeway Club"), etc.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:hostingOrganization',
			name: 'hostingOrganization',
			label: 'hostingOrganization',
			comment:
				"The Organization (airline, travelers' club, retailer, etc.) the membership is made with or which offers the  MemberProgram.",
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:member',
			name: 'member',
			label: 'member',
			comment:
				'A member of an Organization or a ProgramMembership. Organizations can be members of organizations; ProgramMembership is typically for individuals.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:members',
			name: 'members',
			label: 'members',
			comment: 'A member of this organization.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:membershipNumber',
			name: 'membershipNumber',
			label: 'membershipNumber',
			comment: 'A unique identifier for the membership.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:membershipPointsEarned',
			name: 'membershipPointsEarned',
			label: 'membershipPointsEarned',
			comment:
				'The number of membership points earned by the member. If necessary, the unitText can be used to express the units the points are issued in. (E.g. stars, miles, etc.)',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:program',
			name: 'program',
			label: 'program',
			comment:
				'The [MemberProgram](https://schema.org/MemberProgram) associated with a [ProgramMembership](https://schema.org/ProgramMembership).',
			rangeIncludes: ['MemberProgram'],
		},
		{
			id: 'schema:programName',
			name: 'programName',
			label: 'programName',
			comment:
				'The program providing the membership. It is preferable to use [:program](https://schema.org/program) instead.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProgramMembership;
export const ProgramMembership = schemaOrgProgramMembership;

export default schemaOrgProgramMembership;
