import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBroadcastFrequencySpecification = {
	id: 'schema:BroadcastFrequencySpecification',
	name: 'BroadcastFrequencySpecification',
	label: 'BroadcastFrequencySpecification',
	comment: 'The frequency in MHz and the modulation used for a particular BroadcastService.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:broadcastFrequencyValue',
			name: 'broadcastFrequencyValue',
			label: 'broadcastFrequencyValue',
			comment: 'The frequency in MHz for a particular broadcast.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:broadcastSignalModulation',
			name: 'broadcastSignalModulation',
			label: 'broadcastSignalModulation',
			comment: 'The modulation (e.g. FM, AM, etc) used by a particular broadcast service.',
			rangeIncludes: ['QualitativeValue', 'Text'],
		},
		{
			id: 'schema:broadcastSubChannel',
			name: 'broadcastSubChannel',
			label: 'broadcastSubChannel',
			comment: 'The subchannel used for the broadcast.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBroadcastFrequencySpecification;
export const BroadcastFrequencySpecification = schemaOrgBroadcastFrequencySpecification;

export default schemaOrgBroadcastFrequencySpecification;
