import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBoardingPolicyType = {
	id: 'schema:BoardingPolicyType',
	name: 'BoardingPolicyType',
	label: 'BoardingPolicyType',
	comment: 'A type of boarding policy used by an airline.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBoardingPolicyType;
export const BoardingPolicyType = schemaOrgBoardingPolicyType;

export default schemaOrgBoardingPolicyType;
