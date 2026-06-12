import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNewsMediaOrganization = {
	id: 'schema:NewsMediaOrganization',
	name: 'NewsMediaOrganization',
	label: 'NewsMediaOrganization',
	comment: 'A News/Media organization such as a newspaper or TV station.',
	subClassOf: ['Organization', 'Thing'],
	properties: [
		{
			id: 'schema:actionableFeedbackPolicy',
			name: 'actionableFeedbackPolicy',
			label: 'actionableFeedbackPolicy',
			comment:
				'For a [[NewsMediaOrganization]] or other news-related [[Organization]], a statement about public engagement activities (for news media, the newsroom’s), including involving the public - digitally or otherwise -- in coverage decisions, reporting and activities after publication.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:correctionsPolicy',
			name: 'correctionsPolicy',
			label: 'correctionsPolicy',
			comment:
				'For an [[Organization]] (e.g. [[NewsMediaOrganization]]), a statement describing (in news media, the newsroom’s) disclosure and correction policy for errors.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:diversityPolicy',
			name: 'diversityPolicy',
			label: 'diversityPolicy',
			comment:
				'Statement on diversity policy by an [[Organization]] e.g. a [[NewsMediaOrganization]]. For a [[NewsMediaOrganization]], a statement describing the newsroom’s diversity policy on both staffing and sources, typically providing staffing data.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:diversityStaffingReport',
			name: 'diversityStaffingReport',
			label: 'diversityStaffingReport',
			comment:
				'For an [[Organization]] (often but not necessarily a [[NewsMediaOrganization]]), a report on staffing diversity issues. In a news context this might be for example ASNE or RTDNA (US) reports, or self-reported.',
			rangeIncludes: ['Article', 'URL'],
		},
		{
			id: 'schema:ethicsPolicy',
			name: 'ethicsPolicy',
			label: 'ethicsPolicy',
			comment:
				'Statement about ethics policy, e.g. of a [[NewsMediaOrganization]] regarding journalistic and publishing practices, or of a [[Restaurant]], a page describing food source policies. In the case of a [[NewsMediaOrganization]], an ethicsPolicy is typically a statement describing the personal, organizational, and corporate standards of behavior expected by the organization.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:masthead',
			name: 'masthead',
			label: 'masthead',
			comment:
				'For a [[NewsMediaOrganization]], a link to the masthead page or a page listing top editorial management.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:missionCoveragePrioritiesPolicy',
			name: 'missionCoveragePrioritiesPolicy',
			label: 'missionCoveragePrioritiesPolicy',
			comment:
				'For a [[NewsMediaOrganization]], a statement on coverage priorities, including any public agenda or stance on issues.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:noBylinesPolicy',
			name: 'noBylinesPolicy',
			label: 'noBylinesPolicy',
			comment:
				'For a [[NewsMediaOrganization]] or other news-related [[Organization]], a statement explaining when authors of articles are not named in bylines.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:ownershipFundingInfo',
			name: 'ownershipFundingInfo',
			label: 'ownershipFundingInfo',
			comment:
				'For an [[Organization]] (often but not necessarily a [[NewsMediaOrganization]]), a description of organizational ownership structure; funding and grants. In a news/media setting, this is with particular reference to editorial independence.   Note that the [[funder]] is also available and can be used to make basic funder information machine-readable.',
			rangeIncludes: ['AboutPage', 'CreativeWork', 'Text', 'URL'],
		},
		{
			id: 'schema:unnamedSourcesPolicy',
			name: 'unnamedSourcesPolicy',
			label: 'unnamedSourcesPolicy',
			comment:
				'For an [[Organization]] (typically a [[NewsMediaOrganization]]), a statement about policy on use of unnamed sources and the decision process required.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:verificationFactCheckingPolicy',
			name: 'verificationFactCheckingPolicy',
			label: 'verificationFactCheckingPolicy',
			comment:
				'Disclosure about verification and fact-checking processes for a [[NewsMediaOrganization]] or other fact-checking [[Organization]].',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNewsMediaOrganization;
export const NewsMediaOrganization = schemaOrgNewsMediaOrganization;

export default schemaOrgNewsMediaOrganization;
