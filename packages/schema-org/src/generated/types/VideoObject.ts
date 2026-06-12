import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVideoObject = {
	id: 'schema:VideoObject',
	name: 'VideoObject',
	label: 'VideoObject',
	comment: 'A video file.',
	subClassOf: ['MediaObject', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:actor',
			name: 'actor',
			label: 'actor',
			comment:
				'An actor (individual or a group), e.g. in TV, radio, movie, video games etc., or in an event. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['PerformingGroup', 'Person'],
		},
		{
			id: 'schema:actors',
			name: 'actors',
			label: 'actors',
			comment:
				'An actor, e.g. in TV, radio, movie, video games etc. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:caption',
			name: 'caption',
			label: 'caption',
			comment:
				'The caption for this object. For downloadable machine formats (closed caption, subtitles etc.) use MediaObject and indicate the [[encodingFormat]].',
			rangeIncludes: ['MediaObject', 'Text'],
		},
		{
			id: 'schema:director',
			name: 'director',
			label: 'director',
			comment:
				'A director of e.g. TV, radio, movie, video gaming etc. content, or of an event. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:directors',
			name: 'directors',
			label: 'directors',
			comment:
				'A director of e.g. TV, radio, movie, video games etc. content. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:embeddedTextCaption',
			name: 'embeddedTextCaption',
			label: 'embeddedTextCaption',
			comment: "Represents textual captioning from a [[MediaObject]], e.g. text of a 'meme'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
		},
		{
			id: 'schema:transcript',
			name: 'transcript',
			label: 'transcript',
			comment:
				'If this MediaObject is an AudioObject or VideoObject, the transcript of that object.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:videoFrameSize',
			name: 'videoFrameSize',
			label: 'videoFrameSize',
			comment: 'The frame size of the video.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:videoQuality',
			name: 'videoQuality',
			label: 'videoQuality',
			comment: 'The quality of the video.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVideoObject;
export const VideoObject = schemaOrgVideoObject;

export default schemaOrgVideoObject;
