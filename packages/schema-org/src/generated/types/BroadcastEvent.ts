import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBroadcastEvent = {
	id: 'schema:BroadcastEvent',
	name: 'BroadcastEvent',
	label: 'BroadcastEvent',
	comment: 'An over the air or online broadcast event.',
	subClassOf: ['PublicationEvent', 'Event', 'Thing'],
	properties: [
		{
			id: 'schema:broadcastOfEvent',
			name: 'broadcastOfEvent',
			label: 'broadcastOfEvent',
			comment: 'The event being broadcast such as a sporting event or awards ceremony.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:isLiveBroadcast',
			name: 'isLiveBroadcast',
			label: 'isLiveBroadcast',
			comment: 'True if the broadcast is of a live event.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:subtitleLanguage',
			name: 'subtitleLanguage',
			label: 'subtitleLanguage',
			comment:
				'Languages in which subtitles/captions are available, in [IETF BCP 47 standard format](http://tools.ietf.org/html/bcp47).',
			rangeIncludes: ['Language', 'Text'],
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

export const spec = schemaOrgBroadcastEvent;
export const BroadcastEvent = schemaOrgBroadcastEvent;

export default schemaOrgBroadcastEvent;
