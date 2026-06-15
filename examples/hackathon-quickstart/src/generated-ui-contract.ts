import type { ExpectedObject } from '@0xintuition/classifications';
import {
	type ClassificationFieldSpec,
	getClassification,
	getMetadataPredicateMatrixFor,
} from '@0xintuition/classifications';
import { PREDICATE_IDS, PREDICATE_RECORDS } from '@0xintuition/predicates';
import { getPropertiesFor } from '@0xintuition/schema-org';

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

export interface GeneratedCreationContract {
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

export const generatedCreationContracts = Object.fromEntries(
	generatedUiExamples.map((example) => [example.slug, getCreationContract(example.slug)])
) as Record<GeneratedUiExampleSlug, GeneratedCreationContract>;

export const generatedUiCodeExample = `import {
  getClassification,
  getMetadataPredicateMatrixFor,
} from '@0xintuition/classifications';
import { getPredicateId, PREDICATE_RECORDS } from '@0xintuition/predicates';
import { getPropertiesFor } from '@0xintuition/schema-org';

function getCreationContract(slug: string) {
  const classification = getClassification(slug);

  if (!classification?.schema) {
    throw new Error(\`Missing schema-backed classification "\${slug}".\`);
  }

  const properties = getPropertiesFor(classification.schema.type);
  const matrix = getMetadataPredicateMatrixFor(slug);

  return {
    fields: classification.fields.map((field) => ({
      ...field,
      schemaOrigin: properties.find(
        (property) => property.name === field.schemaProperty
      )?.originType,
    })),
    relationships: matrix.map((relation) => ({
      predicate: relation.predicate,
      predicateId: getPredicateId(relation.predicate),
      expectedObjects: relation.expectedObjects,
      label: PREDICATE_RECORDS.find(
        (record) => record.key === relation.predicate
      )?.name,
    })),
  };
}`;

export function getCreationContract(slug: string): GeneratedCreationContract {
	const classification = getClassification(slug);

	if (!classification) {
		throw new Error(`Missing classification "${slug}".`);
	}

	const schemaProperties = classification.schema
		? getPropertiesFor(classification.schema.type)
		: [];
	const propertiesByName = new Map(schemaProperties.map((property) => [property.name, property]));
	const matrix = getMetadataPredicateMatrixFor(slug);

	return {
		classification: {
			slug: classification.slug,
			displayName: classification.displayName,
			description: classification.description,
			schemaType: classification.schema?.type,
		},
		fields: classification.fields.map((field) => toFieldControl(field, propertiesByName)),
		relationships: matrix.map((relation) => {
			const predicateRecord = PREDICATE_RECORDS.find((record) => record.key === relation.predicate);

			return {
				key: relation.predicate,
				label: predicateRecord?.name ?? relation.predicate,
				description: predicateRecord?.description,
				predicateId: PREDICATE_IDS[relation.predicate as keyof typeof PREDICATE_IDS],
				priority: relation.priority ?? 'recommended',
				control: inferRelationshipControl(relation.expectedObjects),
				expectedObjects: relation.expectedObjects,
				targetHint: formatExpectedObjects(relation.expectedObjects),
			};
		}),
		availableFieldCount: schemaProperties.length,
		promotedPredicateCount: classification.metadataPredicates.length,
	};
}

function toFieldControl(
	field: ClassificationFieldSpec,
	propertiesByName: Map<string, { name: string; originType?: string }>
): GeneratedFieldControl {
	const property = field.schemaProperty ? propertiesByName.get(field.schemaProperty) : undefined;

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
					originType: property?.originType,
				}
			: undefined,
	};
}

function inferFieldControl(field: ClassificationFieldSpec): FieldControlKind {
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
