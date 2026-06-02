import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgElectrician = {
	id: 'schema:Electrician',
	name: 'Electrician',
	label: 'Electrician',
	comment: 'An electrician.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgElectrician;
export const Electrician = schemaOrgElectrician;

export default schemaOrgElectrician;
