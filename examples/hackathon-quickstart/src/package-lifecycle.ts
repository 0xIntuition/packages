import { buildAtomDataObject } from '@0xintuition/classifications';
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const SUBJECT_CLASSIFICATION = musicRecordingCreationProfile.classification.slug;

export const sampleValues = {
	name: 'One More Time',
	byArtist: 'Daft Punk',
	inAlbum: 'Discovery',
} as const;

export const sampleObjectsByPredicate = {
	byArtist: 'Daft Punk',
	inAlbum: 'Discovery',
	inPlaylist: 'My Songs Playlist',
	hasCategory: 'French house',
	sameAs: 'One More Time on Apple Music',
} as const;

const schemaHighlights = musicRecordingCreationProfile.fields.flatMap((field) =>
	field.schema
		? [
				{
					id: field.schema.propertyId,
					name: field.schema.property,
					originType: field.schema.originType,
				},
			]
		: []
);

export const lifecycle = {
	subjectClassification: SUBJECT_CLASSIFICATION,
	classification: musicRecordingCreationProfile.classification,
	fields: musicRecordingCreationProfile.fields,
	atomData: buildAtomDataObject(SUBJECT_CLASSIFICATION, sampleValues),
	availableSchemaFieldCount:
		musicRecordingCreationProfile.availableFieldCount ??
		musicRecordingCreationProfile.fields.length,
	schemaHighlights,
	metadataPredicates: musicRecordingCreationProfile.relationships.map((relationship) => {
		const predicateKey = relationship.predicate.key;
		const objectLabel =
			sampleObjectsByPredicate[predicateKey as keyof typeof sampleObjectsByPredicate] ??
			'Target atom';

		return {
			...relationship,
			predicateKey,
			predicateRecord: relationship.predicate,
			predicateId: relationship.predicate.id,
			objectLabel,
			triplePreview: {
				subject: 'Spotify song atom',
				predicate: predicateKey,
				object: objectLabel,
			},
		};
	}),
};

export const codeExample = `import { buildAtomDataObject } from '@0xintuition/classifications';
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const atomData = buildAtomDataObject('music-recording', {
  name: 'One More Time',
  byArtist: 'Daft Punk',
  inAlbum: 'Discovery',
});

const triples = musicRecordingCreationProfile.relationships.map((relationship) => ({
  subject: 'Spotify song atom',
  predicate: relationship.predicate.id,
  object: 'target atom selected by your app',
  expectedObjects: relationship.expectedObjects,
}));`;

export const packageCallouts = {
	fields: `import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const fields = musicRecordingCreationProfile.fields;`,
	atomData: `import { buildAtomDataObject } from '@0xintuition/classifications';

const atomData = buildAtomDataObject('music-recording', {
  name: 'One More Time',
  byArtist: 'Daft Punk',
  inAlbum: 'Discovery',
});`,
	schemaSuperset: `import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const schemaProvenance = musicRecordingCreationProfile.fields.map(
  (field) => field.schema
);

const availableFieldCount =
  musicRecordingCreationProfile.availableFieldCount;`,
	metadataPredicates: `import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const triples = musicRecordingCreationProfile.relationships.map((relationship) => ({
  predicateId: relationship.predicate.id,
  expectedObjects: relationship.expectedObjects,
}));`,
};
