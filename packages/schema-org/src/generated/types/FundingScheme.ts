import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFundingScheme = {
	id: 'schema:FundingScheme',
	name: 'FundingScheme',
	label: 'FundingScheme',
	comment:
		'A FundingScheme combines organizational, project and policy aspects of grant-based funding\n    that sets guidelines, principles and mechanisms to support other kinds of projects and activities.\n    Funding is typically organized via [[Grant]] funding. Examples of funding schemes: Swiss Priority Programmes (SPPs); EU Framework 7 (FP7); Horizon 2020; the NIH-R01 Grant Program; Wellcome institutional strategic support fund. For large scale public sector funding, the management and administration of grant awards is often handled by other, dedicated, organizations - [[FundingAgency]]s such as ERC, REA, ...',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFundingScheme;
export const FundingScheme = schemaOrgFundingScheme;

export default schemaOrgFundingScheme;
