import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFireStation = {
	id: 'schema:FireStation',
	name: 'FireStation',
	label: 'FireStation',
	comment: 'A fire station. With firemen.',
	subClassOf: [
		'CivicStructure',
		'EmergencyService',
		'Place',
		'LocalBusiness',
		'Thing',
		'Organization',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFireStation;
export const FireStation = schemaOrgFireStation;

export default schemaOrgFireStation;
