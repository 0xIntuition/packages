import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAudioObject = {
	id: 'schema:AudioObject',
	name: 'AudioObject',
	label: 'AudioObject',
	comment: 'An audio file.',
	subClassOf: ['MediaObject', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:caption',
			name: 'caption',
			label: 'caption',
			comment:
				'The caption for this object. For downloadable machine formats (closed caption, subtitles etc.) use MediaObject and indicate the [[encodingFormat]].',
			rangeIncludes: ['MediaObject', 'Text'],
		},
		{
			id: 'schema:embeddedTextCaption',
			name: 'embeddedTextCaption',
			label: 'embeddedTextCaption',
			comment: "Represents textual captioning from a [[MediaObject]], e.g. text of a 'meme'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:transcript',
			name: 'transcript',
			label: 'transcript',
			comment:
				'If this MediaObject is an AudioObject or VideoObject, the transcript of that object.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAudioObject;
export const AudioObject = schemaOrgAudioObject;

export default schemaOrgAudioObject;
