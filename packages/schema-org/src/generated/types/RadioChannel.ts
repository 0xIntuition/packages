import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioChannel = {
	id: 'schema:RadioChannel',
	name: 'RadioChannel',
	label: 'RadioChannel',
	comment: 'A unique instance of a radio BroadcastService on a CableOrSatelliteService lineup.',
	subClassOf: ['BroadcastChannel', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadioChannel;
export const RadioChannel = schemaOrgRadioChannel;

export default schemaOrgRadioChannel;
