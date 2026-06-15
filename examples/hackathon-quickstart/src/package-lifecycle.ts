import {
	buildAtomDataObject,
	getClassification,
	getMetadataPredicateMatrixFor,
} from '@0xintuition/classifications';
import { PREDICATE_IDS, PREDICATE_RECORDS } from '@0xintuition/predicates';
import { getPropertiesFor } from '@0xintuition/schema-org';

const SUBJECT_CLASSIFICATION = 'music-recording';

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

const classification = getRequiredClassification(SUBJECT_CLASSIFICATION);
const schemaProperties = classification.schema ? getPropertiesFor(classification.schema.type) : [];
const recommendedSchemaProperties = new Set(
	classification.fields.flatMap((field) => (field.schemaProperty ? [field.schemaProperty] : []))
);
const matrix = getMetadataPredicateMatrixFor(classification.slug);

export const lifecycle = {
	subjectClassification: SUBJECT_CLASSIFICATION,
	classification,
	atomData: buildAtomDataObject(SUBJECT_CLASSIFICATION, sampleValues),
	availableSchemaProperties: schemaProperties,
	recommendedSchemaProperties,
	availableButNotRecommended: schemaProperties.filter(
		(property) => !recommendedSchemaProperties.has(property.name)
	),
	metadataPredicates: matrix.map((entry) => {
		const predicateRecord = PREDICATE_RECORDS.find((record) => record.key === entry.predicate);
		const predicateId = PREDICATE_IDS[entry.predicate as keyof typeof PREDICATE_IDS];
		const objectLabel =
			sampleObjectsByPredicate[entry.predicate as keyof typeof sampleObjectsByPredicate] ??
			'Target atom';

		return {
			...entry,
			predicateKey: entry.predicate,
			predicateRecord,
			predicateId,
			objectLabel,
			triplePreview: {
				subject: 'Spotify song atom',
				predicate: entry.predicate,
				object: objectLabel,
			},
		};
	}),
};

export const codeExample = `import {
  buildAtomDataObject,
  getClassification,
  getMetadataPredicateMatrixFor,
} from '@0xintuition/classifications';
import { getPredicateId } from '@0xintuition/predicates';
import { getPropertiesFor } from '@0xintuition/schema-org';

const classification = getClassification('music-recording');

if (!classification?.schema) {
  throw new Error('Missing schema-backed music-recording classification.');
}

const atomData = buildAtomDataObject('music-recording', {
  name: 'One More Time',
  byArtist: 'Daft Punk',
  inAlbum: 'Discovery',
});

const availableFields = getPropertiesFor(classification.schema.type);
const metadataRelations = getMetadataPredicateMatrixFor('music-recording');

const triples = metadataRelations.map((relation) => ({
  subject: 'Spotify song atom',
  predicate: getPredicateId(relation.predicate),
  object: 'target atom selected by your app',
}));`;

export const packageCallouts = {
	fields: `import { getClassification } from '@0xintuition/classifications';

const classification = getClassification('music-recording');
const fields = classification?.fields ?? [];`,
	atomData: `import { buildAtomDataObject } from '@0xintuition/classifications';

const atomData = buildAtomDataObject('music-recording', {
  name: 'One More Time',
  byArtist: 'Daft Punk',
  inAlbum: 'Discovery',
});`,
	schemaSuperset: `import { getPropertiesFor } from '@0xintuition/schema-org';

const availableFields = getPropertiesFor('MusicRecording');
const inherited = availableFields.filter(
  (property) => property.originType !== 'MusicRecording'
);`,
	metadataPredicates: `import { getMetadataPredicateMatrixFor } from '@0xintuition/classifications';
import { PREDICATE_IDS } from '@0xintuition/predicates';

const relations = getMetadataPredicateMatrixFor('music-recording');
const triples = relations.map((relation) => ({
  predicateId: PREDICATE_IDS[relation.predicate],
  expectedObjects: relation.expectedObjects,
}));`,
};

function getRequiredClassification(slug: string) {
	const spec = getClassification(slug);

	if (!spec) {
		throw new Error(`Missing classification "${slug}".`);
	}

	return spec;
}
