import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBroadcastChannel = {
	id: 'schema:BroadcastChannel',
	name: 'BroadcastChannel',
	label: 'BroadcastChannel',
	comment: 'A unique instance of a BroadcastService on a CableOrSatelliteService lineup.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:broadcastChannelId',
			name: 'broadcastChannelId',
			label: 'broadcastChannelId',
			comment:
				'The unique address by which the BroadcastService can be identified in a provider lineup. In US, this is typically a number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:broadcastFrequency',
			name: 'broadcastFrequency',
			label: 'broadcastFrequency',
			comment:
				'The frequency used for over-the-air broadcasts. Numeric values or simple ranges, e.g. 87-99. In addition a shortcut idiom is supported for frequencies of AM and FM radio channels, e.g. "87 FM".',
			rangeIncludes: ['BroadcastFrequencySpecification', 'Text'],
		},
		{
			id: 'schema:broadcastServiceTier',
			name: 'broadcastServiceTier',
			label: 'broadcastServiceTier',
			comment:
				'The type of service required to have access to the channel (e.g. Standard or Premium).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:genre',
			name: 'genre',
			label: 'genre',
			comment: 'Genre of the creative work, broadcast channel or group.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:inBroadcastLineup',
			name: 'inBroadcastLineup',
			label: 'inBroadcastLineup',
			comment: 'The CableOrSatelliteService offering the channel.',
			rangeIncludes: ['CableOrSatelliteService'],
		},
		{
			id: 'schema:providesBroadcastService',
			name: 'providesBroadcastService',
			label: 'providesBroadcastService',
			comment: 'The BroadcastService offered on this channel.',
			rangeIncludes: ['BroadcastService'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBroadcastChannel;
export const BroadcastChannel = schemaOrgBroadcastChannel;

export default schemaOrgBroadcastChannel;
