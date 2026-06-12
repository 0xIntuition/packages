import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgScreeningEvent = {
	id: 'schema:ScreeningEvent',
	name: 'ScreeningEvent',
	label: 'ScreeningEvent',
	comment: 'A screening of a movie or other video.',
	subClassOf: ['Event', 'Thing'],
	properties: [
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
		{
			id: 'schema:workPresented',
			name: 'workPresented',
			label: 'workPresented',
			comment: 'The movie presented during this event.',
			rangeIncludes: ['Movie'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgScreeningEvent;
export const ScreeningEvent = schemaOrgScreeningEvent;

export default schemaOrgScreeningEvent;
