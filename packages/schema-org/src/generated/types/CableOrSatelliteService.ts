import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCableOrSatelliteService = {
	id: 'schema:CableOrSatelliteService',
	name: 'CableOrSatelliteService',
	label: 'CableOrSatelliteService',
	comment:
		'A service which provides access to media programming like TV or radio. Access may be via cable or satellite.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCableOrSatelliteService;
export const CableOrSatelliteService = schemaOrgCableOrSatelliteService;

export default schemaOrgCableOrSatelliteService;
