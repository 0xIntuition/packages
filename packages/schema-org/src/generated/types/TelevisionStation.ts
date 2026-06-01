import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTelevisionStation = {
	id: 'schema:TelevisionStation',
	name: 'TelevisionStation',
	label: 'TelevisionStation',
	comment: 'A television station.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTelevisionStation;
export const TelevisionStation = schemaOrgTelevisionStation;

export default schemaOrgTelevisionStation;
