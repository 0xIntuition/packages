import type { PredicateKeyReference } from './types.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';

const SAME_AS_MATRIX_SUBJECTS = [
	'article',
	'book',
	'brand',
	'comment',
	'company',
	'dataset',
	'defined-term',
	'event',
	'image',
	'job-posting',
	'local-business',
	'location',
	'mobile-application',
	'movie',
	'music-album',
	'music-group',
	'news-article',
	'person',
	'podcast-episode',
	'podcast-series',
	'product',
	'review',
	'service',
	'software',
	'software-application',
	'thing',
	'tv-series',
	'video-object',
	'web-page',
	'web-site',
] as const;

export type PrimitiveValueType =
	| 'string'
	| 'url'
	| 'number'
	| 'integer'
	| 'boolean'
	| 'iso-date'
	| 'iso-datetime'
	| 'duration';

export type ExpectedObject =
	| { kind: 'classification'; slug: string }
	| { kind: 'schema'; context: string; type: string }
	| { kind: 'primitive'; valueType: PrimitiveValueType }
	| { kind: 'same-classification' }
	| { kind: 'any'; reason: string };

export type SchemaMappingMatch = 'exact' | 'semantic' | 'broader' | 'narrower';

export interface SchemaMapping {
	context: string;
	property: string;
	match: SchemaMappingMatch;
	notes?: string;
}

export type MetadataPredicatePriority = 'core' | 'recommended' | 'optional';

export interface MetadataPredicateMatrixEntry {
	subjectClassification: string;
	predicate: PredicateKeyReference;
	expectedObjects: readonly ExpectedObject[];
	schemaMappings?: readonly SchemaMapping[];
	priority?: MetadataPredicatePriority;
	notes?: string;
}

const SAME_AS_MATRIX_ENTRIES: readonly MetadataPredicateMatrixEntry[] = SAME_AS_MATRIX_SUBJECTS.map(
	(subjectClassification) => ({
		subjectClassification,
		predicate: 'sameAs',
		expectedObjects: [{ kind: 'same-classification' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'sameAs', match: 'exact' }],
		priority: 'recommended',
		notes: 'Use for strict identity links only between atoms with the same classification.',
	})
);

const CURATED_RELATIONSHIP_MATRIX_ENTRIES = [
	{
		subjectClassification: 'book',
		predicate: 'authoredBy',
		expectedObjects: [{ kind: 'classification', slug: 'person' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'author', match: 'semantic' }],
		priority: 'core',
	},
	{
		subjectClassification: 'book',
		predicate: 'publisher',
		expectedObjects: [{ kind: 'classification', slug: 'company' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'publisher', match: 'exact' }],
		priority: 'recommended',
	},
	{
		subjectClassification: 'book',
		predicate: 'hasCategory',
		expectedObjects: [{ kind: 'classification', slug: 'defined-term' }],
		schemaMappings: [
			{
				context: SCHEMA_ORG_CONTEXT,
				property: 'genre',
				match: 'broader',
				notes:
					'`hasCategory` supports Intuition discovery facets; schema.org `genre` is a narrower creative-work taxonomy field.',
			},
		],
		priority: 'recommended',
	},
	{
		subjectClassification: 'book',
		predicate: 'reference',
		expectedObjects: [{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'CreativeWork' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'citation', match: 'semantic' }],
		priority: 'optional',
	},
	{
		subjectClassification: 'book',
		predicate: 'listedIn',
		expectedObjects: [{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'Collection' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'isPartOf', match: 'semantic' }],
		priority: 'optional',
		notes: 'Use until Intuition promotes a first-class collection/list classification.',
	},
	{
		subjectClassification: 'person',
		predicate: 'memberOf',
		expectedObjects: [{ kind: 'classification', slug: 'company' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'memberOf', match: 'exact' }],
		priority: 'recommended',
	},
	{
		subjectClassification: 'person',
		predicate: 'employedBy',
		expectedObjects: [{ kind: 'classification', slug: 'company' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'worksFor', match: 'semantic' }],
		priority: 'recommended',
	},
	{
		subjectClassification: 'person',
		predicate: 'affiliatedWith',
		expectedObjects: [{ kind: 'classification', slug: 'company' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'affiliation', match: 'semantic' }],
		priority: 'optional',
	},
	{
		subjectClassification: 'person',
		predicate: 'alumniOf',
		expectedObjects: [
			{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'EducationalOrganization' },
		],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'alumniOf', match: 'exact' }],
		priority: 'optional',
		notes:
			'EducationalOrganization is schema.org-backed until Intuition promotes a school/university classification.',
	},
	{
		subjectClassification: 'person',
		predicate: 'url',
		expectedObjects: [{ kind: 'primitive', valueType: 'url' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'url', match: 'exact' }],
		priority: 'recommended',
	},
	{
		subjectClassification: 'movie',
		predicate: 'actor',
		expectedObjects: [{ kind: 'classification', slug: 'person' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'actor', match: 'exact' }],
		priority: 'core',
	},
	{
		subjectClassification: 'movie',
		predicate: 'director',
		expectedObjects: [{ kind: 'classification', slug: 'person' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'director', match: 'exact' }],
		priority: 'core',
	},
	{
		subjectClassification: 'movie',
		predicate: 'productionCompany',
		expectedObjects: [{ kind: 'classification', slug: 'company' }],
		schemaMappings: [
			{ context: SCHEMA_ORG_CONTEXT, property: 'productionCompany', match: 'exact' },
		],
		priority: 'recommended',
	},
	{
		subjectClassification: 'movie',
		predicate: 'musicBy',
		expectedObjects: [
			{ kind: 'classification', slug: 'music-group' },
			{ kind: 'classification', slug: 'person' },
		],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'musicBy', match: 'exact' }],
		priority: 'optional',
	},
	{
		subjectClassification: 'movie',
		predicate: 'trailer',
		expectedObjects: [{ kind: 'classification', slug: 'video-object' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'trailer', match: 'exact' }],
		priority: 'recommended',
	},
	{
		subjectClassification: 'movie',
		predicate: 'hasCategory',
		expectedObjects: [{ kind: 'classification', slug: 'defined-term' }],
		schemaMappings: [
			{
				context: SCHEMA_ORG_CONTEXT,
				property: 'genre',
				match: 'broader',
				notes:
					'`hasCategory` supports Intuition discovery facets; schema.org `genre` is a narrower media taxonomy field.',
			},
		],
		priority: 'recommended',
	},
	{
		subjectClassification: 'software-application',
		predicate: 'url',
		expectedObjects: [{ kind: 'primitive', valueType: 'url' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'url', match: 'exact' }],
		priority: 'recommended',
	},
	{
		subjectClassification: 'software-application',
		predicate: 'hasCategory',
		expectedObjects: [{ kind: 'classification', slug: 'defined-term' }],
		schemaMappings: [
			{
				context: SCHEMA_ORG_CONTEXT,
				property: 'applicationCategory',
				match: 'broader',
				notes:
					'`hasCategory` supports Intuition discovery facets; schema.org `applicationCategory` is app-specific taxonomy.',
			},
		],
		priority: 'recommended',
	},
	{
		subjectClassification: 'software-application',
		predicate: 'compatibleWith',
		expectedObjects: [{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'SoftwareApplication' }],
		schemaMappings: [
			{ context: SCHEMA_ORG_CONTEXT, property: 'softwareRequirements', match: 'semantic' },
		],
		priority: 'optional',
	},
	{
		subjectClassification: 'software-application',
		predicate: 'softwareAddOn',
		expectedObjects: [{ kind: 'classification', slug: 'software-application' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'softwareAddOn', match: 'exact' }],
		priority: 'optional',
	},
] as const satisfies readonly MetadataPredicateMatrixEntry[];

export const METADATA_PREDICATE_MATRIX = deepFreeze([
	{
		subjectClassification: 'music-recording',
		predicate: 'byArtist',
		expectedObjects: [
			{ kind: 'classification', slug: 'music-group' },
			{ kind: 'classification', slug: 'person' },
		],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'byArtist', match: 'exact' }],
		priority: 'core',
	},
	{
		subjectClassification: 'music-recording',
		predicate: 'inAlbum',
		expectedObjects: [{ kind: 'classification', slug: 'music-album' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'inAlbum', match: 'exact' }],
		priority: 'core',
	},
	{
		subjectClassification: 'music-recording',
		predicate: 'inPlaylist',
		expectedObjects: [{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'MusicPlaylist' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'inPlaylist', match: 'exact' }],
		priority: 'recommended',
		notes:
			'MusicPlaylist is schema.org-backed until Intuition promotes a music-playlist classification.',
	},
	{
		subjectClassification: 'music-recording',
		predicate: 'hasCategory',
		expectedObjects: [{ kind: 'classification', slug: 'defined-term' }],
		schemaMappings: [
			{
				context: SCHEMA_ORG_CONTEXT,
				property: 'genre',
				match: 'broader',
				notes:
					'`hasCategory` is Intuition discovery metadata; schema.org `genre` is a narrower media taxonomy field.',
			},
		],
		priority: 'recommended',
	},
	{
		subjectClassification: 'music-recording',
		predicate: 'sameAs',
		expectedObjects: [{ kind: 'same-classification' }],
		schemaMappings: [{ context: SCHEMA_ORG_CONTEXT, property: 'sameAs', match: 'exact' }],
		priority: 'recommended',
		notes:
			'Use for strict identity links only, such as Spotify and Apple Music representations of the same recording.',
	},
	...CURATED_RELATIONSHIP_MATRIX_ENTRIES,
	...SAME_AS_MATRIX_ENTRIES,
] as const satisfies readonly MetadataPredicateMatrixEntry[]);

const MATRIX_BY_SUBJECT = new Map<string, readonly MetadataPredicateMatrixEntry[]>();
const MATRIX_BY_SUBJECT_AND_PREDICATE = new Map<string, MetadataPredicateMatrixEntry>();

for (const entry of METADATA_PREDICATE_MATRIX) {
	const existingEntries = MATRIX_BY_SUBJECT.get(entry.subjectClassification) ?? [];
	MATRIX_BY_SUBJECT.set(entry.subjectClassification, [...existingEntries, entry]);
	MATRIX_BY_SUBJECT_AND_PREDICATE.set(
		matrixKey(entry.subjectClassification, entry.predicate),
		entry
	);
}

export function getMetadataPredicateMatrixFor(
	subjectClassification: string
): readonly MetadataPredicateMatrixEntry[] {
	return MATRIX_BY_SUBJECT.get(subjectClassification) ?? [];
}

export function getMetadataPredicateRelation(
	subjectClassification: string,
	predicate: PredicateKeyReference
): MetadataPredicateMatrixEntry | undefined {
	return MATRIX_BY_SUBJECT_AND_PREDICATE.get(matrixKey(subjectClassification, predicate));
}

function matrixKey(subjectClassification: string, predicate: PredicateKeyReference): string {
	return `${subjectClassification}\u0000${predicate}`;
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);

		for (const nestedValue of Object.values(value as Record<string, unknown>)) {
			deepFreeze(nestedValue);
		}
	}

	return value;
}
