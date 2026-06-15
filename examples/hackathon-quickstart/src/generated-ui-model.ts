import type {
	CreationField,
	CreationProfile,
	CreationRelationship,
	ExpectedObject,
} from '@0xintuition/classifications';
import { bookCreationProfile } from '@0xintuition/classifications/creation/book';
import { movieCreationProfile } from '@0xintuition/classifications/creation/movie';
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';
import { personCreationProfile } from '@0xintuition/classifications/creation/person';
import { softwareApplicationCreationProfile } from '@0xintuition/classifications/creation/software-application';

export const generatedUiExampleSlugs = [
	'music-recording',
	'book',
	'person',
	'movie',
	'software-application',
] as const;

export type GeneratedUiExampleSlug = (typeof generatedUiExampleSlugs)[number];

export interface GeneratedUiExample {
	slug: GeneratedUiExampleSlug;
	title: string;
	description: string;
	sampleRelationships: Record<string, string>;
}

export const generatedUiExamples: readonly GeneratedUiExample[] = [
	{
		slug: 'music-recording',
		title: 'Spotify song',
		description: 'Richer relationship matrix: artist, album, playlist, category, sameAs.',
		sampleRelationships: {
			byArtist: 'Daft Punk',
			inAlbum: 'Discovery',
			inPlaylist: 'My Songs Playlist',
			hasCategory: 'French house',
			sameAs: 'One More Time on Apple Music',
		},
	},
	{
		slug: 'book',
		title: 'Book',
		description: 'Recommended atom fields pair with matrix-modeled relationship targets.',
		sampleRelationships: {
			sameAs: 'Siddhartha on Open Library',
		},
	},
	{
		slug: 'person',
		title: 'Person',
		description: 'Structured required names with identity linking as the modeled relationship.',
		sampleRelationships: {
			sameAs: 'Vitalik Buterin on Wikidata',
		},
	},
	{
		slug: 'movie',
		title: 'Movie',
		description: 'Date-like schema fields stay atom data while relationship object policy matures.',
		sampleRelationships: {
			sameAs: 'Inception on IMDb',
		},
	},
	{
		slug: 'software-application',
		title: 'Software app',
		description: 'URL fields generate inputs while sameAs stays a strict identity relationship.',
		sampleRelationships: {
			sameAs: 'Notion on Product Hunt',
		},
	},
];

type FieldControlKind = 'text' | 'url-list' | 'date' | 'number';
type RelationshipControlKind = 'atom-search' | 'schema-backed-search' | 'literal-input';

export interface GeneratedFieldControl {
	key: string;
	label: string;
	description: string;
	required: boolean;
	placeholder?: string;
	control: FieldControlKind;
	schemaProperty?: {
		name: string;
		originType?: string;
	};
}

export interface GeneratedRelationshipControl {
	key: string;
	label: string;
	description?: string;
	predicateId?: string;
	priority: string;
	control: RelationshipControlKind;
	expectedObjects: readonly ExpectedObject[];
	targetHint: string;
}

export interface GeneratedCreationModel {
	classification: {
		slug: string;
		displayName: string;
		description: string;
		schemaType?: string;
	};
	fields: GeneratedFieldControl[];
	relationships: GeneratedRelationshipControl[];
	availableFieldCount: number;
	promotedPredicateCount: number;
}

const creationProfilesBySlug = {
	'music-recording': musicRecordingCreationProfile,
	book: bookCreationProfile,
	person: personCreationProfile,
	movie: movieCreationProfile,
	'software-application': softwareApplicationCreationProfile,
} satisfies Record<GeneratedUiExampleSlug, CreationProfile>;

export const generatedCreationModels = Object.fromEntries(
	generatedUiExampleSlugs.map((slug) => [slug, getCreationModel(slug)])
) as Record<GeneratedUiExampleSlug, GeneratedCreationModel>;

export const generatedUiCodeExample = `import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const fields = musicRecordingCreationProfile.fields.map((field) => ({
  key: field.key,
  label: field.label,
  required: field.required,
  schemaOrigin: field.schema?.originType,
}));

const relationships = musicRecordingCreationProfile.relationships.map(
  (relationship) => ({
    predicateId: relationship.predicate.id,
    label: relationship.predicate.label,
    expectedObjects: relationship.expectedObjects,
  })
);`;

export function getCreationModel(slug: GeneratedUiExampleSlug): GeneratedCreationModel {
	const profile = creationProfilesBySlug[slug];

	return {
		classification: {
			slug: profile.classification.slug,
			displayName: profile.classification.displayName,
			description: profile.classification.description,
			schemaType: profile.classification.schema?.type,
		},
		fields: profile.fields.map(toFieldControl),
		relationships: profile.relationships.map(toRelationshipControl),
		availableFieldCount: profile.availableFieldCount,
		promotedPredicateCount: profile.relationships.length,
	};
}

function toFieldControl(field: CreationField): GeneratedFieldControl {
	return {
		key: field.key,
		label: field.label,
		description: field.description,
		required: field.required,
		placeholder: field.placeholder,
		control: inferFieldControl(field),
		schemaProperty: field.schemaProperty
			? {
					name: field.schemaProperty,
					originType: field.schema?.originType,
				}
			: undefined,
	};
}

function toRelationshipControl(relationship: CreationRelationship): GeneratedRelationshipControl {
	return {
		key: relationship.predicate.key,
		label: relationship.predicate.label,
		description: relationship.predicate.description,
		predicateId: relationship.predicate.id,
		priority: relationship.priority ?? 'recommended',
		control: inferRelationshipControl(relationship.expectedObjects),
		expectedObjects: relationship.expectedObjects,
		targetHint: formatExpectedObjects(relationship.expectedObjects),
	};
}

function inferFieldControl(field: CreationField): FieldControlKind {
	switch (field.fieldType) {
		case 'string[]':
			return field.key === 'sameAs' ? 'url-list' : 'text';
		case 'url':
			return 'url-list';
		case 'iso-date':
		case 'iso-datetime':
			return 'date';
		case 'number':
		case 'integer':
			return 'number';
		case 'string':
		case 'address':
			return 'text';
		default:
			return field.fieldType satisfies never;
	}
}

function inferRelationshipControl(
	expectedObjects: readonly ExpectedObject[]
): RelationshipControlKind {
	if (expectedObjects.some((object) => object.kind === 'primitive')) {
		return 'literal-input';
	}

	if (expectedObjects.some((object) => object.kind === 'schema')) {
		return 'schema-backed-search';
	}

	return 'atom-search';
}

function formatExpectedObjects(expectedObjects: readonly ExpectedObject[]): string {
	return expectedObjects.map(formatExpectedObject).join(' or ');
}

function formatExpectedObject(object: ExpectedObject): string {
	switch (object.kind) {
		case 'classification':
			return object.slug;
		case 'schema':
			return `schema:${object.type}`;
		case 'primitive':
			return object.valueType;
		case 'same-classification':
			return 'same classification';
		case 'any':
			return object.reason;
		default:
			return object satisfies never;
	}
}
