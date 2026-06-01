import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPoliceStation = {
	id: 'schema:PoliceStation',
	name: 'PoliceStation',
	label: 'PoliceStation',
	comment: 'A police station.',
	subClassOf: [
		'CivicStructure',
		'Place',
		'Thing',
		'EmergencyService',
		'LocalBusiness',
		'Organization',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPoliceStation;
export const PoliceStation = schemaOrgPoliceStation;

export default schemaOrgPoliceStation;
