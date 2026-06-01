import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaObject = {
	id: 'schema:MediaObject',
	name: 'MediaObject',
	label: 'MediaObject',
	comment:
		"A media object, such as an image, video, audio, or text object embedded in a web page or a downloadable dataset i.e. DataDownload. Note that a creative work may have many media objects associated with it on the same web page. For example, a page about a single song (MusicRecording) may have a music video (VideoObject), and a high and low bandwidth audio stream (2 AudioObject's).",
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:associatedArticle',
			name: 'associatedArticle',
			label: 'associatedArticle',
			comment: 'A NewsArticle associated with the Media Object.',
			rangeIncludes: ['NewsArticle'],
		},
		{
			id: 'schema:bitrate',
			name: 'bitrate',
			label: 'bitrate',
			comment: 'The bitrate of the media object.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:contentSize',
			name: 'contentSize',
			label: 'contentSize',
			comment: 'File size in (mega/kilo)bytes.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:contentUrl',
			name: 'contentUrl',
			label: 'contentUrl',
			comment: 'Actual bytes of the media object, for example the image file or video file.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:embedUrl',
			name: 'embedUrl',
			label: 'embedUrl',
			comment:
				'A URL pointing to a player for a specific video. In general, this is the information in the ```src``` element of an ```embed``` tag and should not be the same as the content of the ```loc``` tag.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:encodesCreativeWork',
			name: 'encodesCreativeWork',
			label: 'encodesCreativeWork',
			comment: 'The CreativeWork encoded by this media object.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:encodingFormat',
			name: 'encodingFormat',
			label: 'encodingFormat',
			comment:
				'Media type typically expressed using a MIME format (see [IANA site](http://www.iana.org/assignments/media-types/media-types.xhtml) and [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)), e.g. application/zip for a SoftwareApplication binary, audio/mpeg for .mp3 etc.\n\nIn cases where a [[CreativeWork]] has several media type representations, [[encoding]] can be used to indicate each [[MediaObject]] alongside particular [[encodingFormat]] information.\n\nUnregistered or niche encoding and file formats can be indicated instead via the most appropriate URL, e.g. defining Web page or a Wikipedia/Wikidata entry.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:endTime',
			name: 'endTime',
			label: 'endTime',
			comment:
				"The endTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to end. For actions that span a period of time, when the action was performed. E.g. John wrote a book from January to *December*. For media, including audio and video, it's the time offset of the end of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:height',
			name: 'height',
			label: 'height',
			comment: 'The height of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
		{
			id: 'schema:ineligibleRegion',
			name: 'ineligibleRegion',
			label: 'ineligibleRegion',
			comment:
				'The ISO 3166-1 (ISO 3166-1 alpha-2) or ISO 3166-2 code, the place, or the GeoShape for the geo-political region(s) for which the offer or delivery charge specification is not valid, e.g. a region where the transaction is not allowed.\\n\\nSee also [[eligibleRegion]].\n      ',
			rangeIncludes: ['GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:interpretedAsClaim',
			name: 'interpretedAsClaim',
			label: 'interpretedAsClaim',
			comment:
				'Used to indicate a specific claim contained, implied, translated or refined from the content of a [[MediaObject]] or other [[CreativeWork]]. The interpreting party can be indicated using [[claimInterpreter]].',
			rangeIncludes: ['Claim'],
		},
		{
			id: 'schema:playerType',
			name: 'playerType',
			label: 'playerType',
			comment: 'Player type required&#x2014;for example, Flash or Silverlight.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:productionCompany',
			name: 'productionCompany',
			label: 'productionCompany',
			comment:
				'The production company or studio responsible for the item, e.g. series, video game, episode etc.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:regionsAllowed',
			name: 'regionsAllowed',
			label: 'regionsAllowed',
			comment:
				"The regions where the media is allowed. If not specified, then it's assumed to be allowed everywhere. Specify the countries in [ISO 3166 format](http://en.wikipedia.org/wiki/ISO_3166).",
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:requiresSubscription',
			name: 'requiresSubscription',
			label: 'requiresSubscription',
			comment:
				"Indicates if use of the media require a subscription  (either paid or free). Allowed values are ```true``` or ```false``` (note that an earlier version had 'yes', 'no').",
			rangeIncludes: ['Boolean', 'MediaSubscription'],
		},
		{
			id: 'schema:sha256',
			name: 'sha256',
			label: 'sha256',
			comment:
				"The [SHA-2](https://en.wikipedia.org/wiki/SHA-2) SHA256 hash of the content of the item. For example, a zero-length input has value 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:startTime',
			name: 'startTime',
			label: 'startTime',
			comment:
				"The startTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to start. For actions that span a period of time, when the action was performed. E.g. John wrote a book from *January* to December. For media, including audio and video, it's the time offset of the start of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:uploadDate',
			name: 'uploadDate',
			label: 'uploadDate',
			comment:
				'Date (including time if available) when this media object was uploaded to this site.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:width',
			name: 'width',
			label: 'width',
			comment: 'The width of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaObject;
export const MediaObject = schemaOrgMediaObject;

export default schemaOrgMediaObject;
