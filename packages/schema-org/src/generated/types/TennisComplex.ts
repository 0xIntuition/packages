import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTennisComplex = {
	id: 'schema:TennisComplex',
	name: 'TennisComplex',
	label: 'TennisComplex',
	comment: 'A tennis complex.',
	subClassOf: ['SportsActivityLocation', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTennisComplex;
export const TennisComplex = schemaOrgTennisComplex;

export default schemaOrgTennisComplex;
