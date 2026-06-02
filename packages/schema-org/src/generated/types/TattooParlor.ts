import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTattooParlor = {
	id: 'schema:TattooParlor',
	name: 'TattooParlor',
	label: 'TattooParlor',
	comment: 'A tattoo parlor.',
	subClassOf: ['HealthAndBeautyBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTattooParlor;
export const TattooParlor = schemaOrgTattooParlor;

export default schemaOrgTattooParlor;
