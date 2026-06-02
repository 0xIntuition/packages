import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGeneralContractor = {
	id: 'schema:GeneralContractor',
	name: 'GeneralContractor',
	label: 'GeneralContractor',
	comment: 'A general contractor.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGeneralContractor;
export const GeneralContractor = schemaOrgGeneralContractor;

export default schemaOrgGeneralContractor;
