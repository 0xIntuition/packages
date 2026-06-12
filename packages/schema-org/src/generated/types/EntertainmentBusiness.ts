import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEntertainmentBusiness = {
	id: 'schema:EntertainmentBusiness',
	name: 'EntertainmentBusiness',
	label: 'EntertainmentBusiness',
	comment: 'A business providing entertainment.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEntertainmentBusiness;
export const EntertainmentBusiness = schemaOrgEntertainmentBusiness;

export default schemaOrgEntertainmentBusiness;
