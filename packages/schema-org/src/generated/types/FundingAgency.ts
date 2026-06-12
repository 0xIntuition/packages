import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFundingAgency = {
	id: 'schema:FundingAgency',
	name: 'FundingAgency',
	label: 'FundingAgency',
	comment:
		'A FundingAgency is an organization that implements one or more [[FundingScheme]]s and manages\n    the granting process (via [[Grant]]s, typically [[MonetaryGrant]]s).\n    A funding agency is not always required for grant funding, e.g. philanthropic giving, corporate sponsorship etc.\n    \nExamples of funding agencies include ERC, REA, NIH, Bill and Melinda Gates Foundation, ...\n    ',
	subClassOf: ['Project', 'Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFundingAgency;
export const FundingAgency = schemaOrgFundingAgency;

export default schemaOrgFundingAgency;
