import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGovernmentBenefitsType = {
	id: 'schema:GovernmentBenefitsType',
	name: 'GovernmentBenefitsType',
	label: 'GovernmentBenefitsType',
	comment:
		'GovernmentBenefitsType enumerates several kinds of government benefits to support the COVID-19 situation. Note that this structure may not capture all benefits offered.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGovernmentBenefitsType;
export const GovernmentBenefitsType = schemaOrgGovernmentBenefitsType;

export default schemaOrgGovernmentBenefitsType;
