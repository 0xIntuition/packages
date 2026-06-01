import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioBroadcastService = {
	id: 'schema:RadioBroadcastService',
	name: 'RadioBroadcastService',
	label: 'RadioBroadcastService',
	comment:
		'A delivery service through which radio content is provided via broadcast over the air or online.',
	subClassOf: ['BroadcastService', 'Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadioBroadcastService;
export const RadioBroadcastService = schemaOrgRadioBroadcastService;

export default schemaOrgRadioBroadcastService;
