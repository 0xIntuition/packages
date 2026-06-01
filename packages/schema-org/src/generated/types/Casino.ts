import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCasino = {
	id: 'schema:Casino',
	name: 'Casino',
	label: 'Casino',
	comment: 'A casino.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCasino;
export const Casino = schemaOrgCasino;

export default schemaOrgCasino;
