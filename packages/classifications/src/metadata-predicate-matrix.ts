import type { PredicateKeyReference } from './types.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';

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
