import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBroadcastService = {
	id: 'schema:BroadcastService',
	name: 'BroadcastService',
	label: 'BroadcastService',
	comment:
		'A delivery service through which content is provided via broadcast over the air or online.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:area',
			name: 'area',
			label: 'area',
			comment: 'The area within which users can expect to reach the broadcast service.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:broadcastAffiliateOf',
			name: 'broadcastAffiliateOf',
			label: 'broadcastAffiliateOf',
			comment: 'The media network(s) whose content is broadcast on this station.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:broadcastDisplayName',
			name: 'broadcastDisplayName',
			label: 'broadcastDisplayName',
			comment:
				'The name displayed in the channel guide. For many US affiliates, it is the network name.',
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
			id: 'schema:broadcastTimezone',
			name: 'broadcastTimezone',
			label: 'broadcastTimezone',
			comment:
				'The timezone in [ISO 8601 format](http://en.wikipedia.org/wiki/ISO_8601) for which the service bases its broadcasts.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:broadcaster',
			name: 'broadcaster',
			label: 'broadcaster',
			comment: 'The organization owning or operating the broadcast service.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:callSign',
			name: 'callSign',
			label: 'callSign',
			comment:
				'A [callsign](https://en.wikipedia.org/wiki/Call_sign), as used in broadcasting and radio communications to identify people, radio and TV stations, or vehicles.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:hasBroadcastChannel',
			name: 'hasBroadcastChannel',
			label: 'hasBroadcastChannel',
			comment: 'A broadcast channel of a broadcast service.',
			rangeIncludes: ['BroadcastChannel'],
		},
		{
			id: 'schema:inLanguage',
			name: 'inLanguage',
			label: 'inLanguage',
			comment:
				'The language of the content or performance or used in an action. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[availableLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:parentService',
			name: 'parentService',
			label: 'parentService',
			comment:
				'A broadcast service to which the broadcast service may belong to such as regional variations of a national channel.',
			rangeIncludes: ['BroadcastService'],
		},
		{
			id: 'schema:videoFormat',
			name: 'videoFormat',
			label: 'videoFormat',
			comment: 'The type of screening or video broadcast used (e.g. IMAX, 3D, SD, HD, etc.).',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBroadcastService;
export const BroadcastService = schemaOrgBroadcastService;

export default schemaOrgBroadcastService;
