import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmergencyService = {
	id: 'schema:EmergencyService',
	name: 'EmergencyService',
	label: 'EmergencyService',
	comment: 'An emergency service, such as a fire station or ER.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmergencyService;
export const EmergencyService = schemaOrgEmergencyService;

export default schemaOrgEmergencyService;
