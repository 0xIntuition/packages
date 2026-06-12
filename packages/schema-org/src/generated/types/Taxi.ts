import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTaxi = {
	id: 'schema:Taxi',
	name: 'Taxi',
	label: 'Taxi',
	comment: 'A taxi.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTaxi;
export const Taxi = schemaOrgTaxi;

export default schemaOrgTaxi;
