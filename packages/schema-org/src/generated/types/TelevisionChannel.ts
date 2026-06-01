import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTelevisionChannel = {
	id: 'schema:TelevisionChannel',
	name: 'TelevisionChannel',
	label: 'TelevisionChannel',
	comment:
		'A unique instance of a television BroadcastService on a CableOrSatelliteService lineup.',
	subClassOf: ['BroadcastChannel', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTelevisionChannel;
export const TelevisionChannel = schemaOrgTelevisionChannel;

export default schemaOrgTelevisionChannel;
