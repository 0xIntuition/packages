import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMovingCompany = {
	id: 'schema:MovingCompany',
	name: 'MovingCompany',
	label: 'MovingCompany',
	comment: 'A moving company.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMovingCompany;
export const MovingCompany = schemaOrgMovingCompany;

export default schemaOrgMovingCompany;
