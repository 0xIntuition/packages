import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCasino = {
	id: 'schema:Casino',
	name: 'Casino',
	label: 'Casino',
	comment: 'A casino.',
	subClassOf: ['EntertainmentBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCasino;
export const Casino = schemaOrgCasino;

export default schemaOrgCasino;
