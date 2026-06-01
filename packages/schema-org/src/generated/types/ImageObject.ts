import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgImageObject = {
	id: 'schema:ImageObject',
	name: 'ImageObject',
	label: 'ImageObject',
	comment: 'An image file.',
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
			id: 'schema:exifData',
			name: 'exifData',
			label: 'exifData',
			comment: 'exif data for this object.',
			rangeIncludes: ['PropertyValue', 'Text'],
		},
		{
			id: 'schema:representativeOfPage',
			name: 'representativeOfPage',
			label: 'representativeOfPage',
			comment: 'Indicates whether this image is representative of the content of the page.',
			rangeIncludes: ['Boolean'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgImageObject;
export const ImageObject = schemaOrgImageObject;

export default schemaOrgImageObject;
