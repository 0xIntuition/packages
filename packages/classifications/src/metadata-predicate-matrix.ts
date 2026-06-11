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

function classification(slug: string): ExpectedObject {
	return { kind: 'classification', slug };
}

function schemaType(type: string): ExpectedObject {
	return { kind: 'schema', context: SCHEMA_ORG_CONTEXT, type };
}

function primitive(valueType: PrimitiveValueType): ExpectedObject {
	return { kind: 'primitive', valueType };
}

function anyTarget(reason: string): ExpectedObject {
	return { kind: 'any', reason };
}

function matrixEntry(
	subjectClassification: string,
	predicate: PredicateKeyReference,
	expectedObjects: readonly ExpectedObject[],
	options: Omit<
		MetadataPredicateMatrixEntry,
		'subjectClassification' | 'predicate' | 'expectedObjects'
	> = {}
): MetadataPredicateMatrixEntry {
	return { subjectClassification, predicate, expectedObjects, ...options };
}

const BROAD_REVIEW_TARGET = anyTarget(
	'Reviews and ratings can target products, media, services, organizations, or other atom classifications.'
);
const BROAD_REFERENCE_TARGET = anyTarget(
	'References can target many atom classifications; use narrower rows later where product semantics require them.'
);
const BROAD_CONTAIN_TARGET = anyTarget(
	'Containment is intentionally broad and can target any atom classification for collections or grouped entities.'
);
const BROAD_ACCOUNT_TARGET = anyTarget(
	'Account links can target wallets, social profiles, platform accounts, or owner atoms until ownership semantics are split.'
);
const BROAD_USAGE_TARGET = anyTarget(
	'Usage can target software, protocols, tokens, concepts, or other atoms depending on the subject context.'
);

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

const MATRIX_COVERAGE_ENTRIES = [
	matrixEntry('aggregate-rating', 'itemReviewed', [BROAD_REVIEW_TARGET]),
	matrixEntry('aggregate-rating', 'authoredBy', [classification('person')]),
	matrixEntry('article', 'authoredBy', [classification('person')]),
	matrixEntry('article', 'publisher', [classification('company')]),
	matrixEntry('article', 'hasDescription', [primitive('string')]),
	matrixEntry('article', 'url', [primitive('url')]),
	matrixEntry('article', 'reference', [schemaType('CreativeWork'), BROAD_REFERENCE_TARGET]),
	matrixEntry('article', 'listedIn', [schemaType('Collection')], {
		notes: 'Use until Intuition promotes a first-class collection/list classification.',
	}),
	matrixEntry('article', 'hasCategory', [classification('defined-term')]),
	matrixEntry('brand', 'url', [primitive('url')]),
	matrixEntry('brand', 'imgUrl', [primitive('url')]),
	matrixEntry('comment', 'authoredBy', [classification('person')]),
	matrixEntry('comment', 'parentItem', [classification('comment'), BROAD_REFERENCE_TARGET]),
	matrixEntry('company', 'founder', [classification('person')]),
	matrixEntry('company', 'founded', [
		classification('company'),
		classification('software'),
		classification('software-application'),
	]),
	matrixEntry('company', 'memberOf', [classification('company')]),
	matrixEntry('company', 'parentOrganization', [classification('company')]),
	matrixEntry('company', 'subOrganization', [classification('company')]),
	matrixEntry('company', 'brand', [classification('brand')]),
	matrixEntry('company', 'locatedIn', [classification('location')]),
	matrixEntry('company', 'sponsoredBy', [classification('company')]),
	matrixEntry('company', 'url', [primitive('url')]),
	matrixEntry('dataset', 'createdBy', [classification('person'), classification('company')]),
	matrixEntry('dataset', 'publisher', [classification('company')]),
	matrixEntry('dataset', 'reference', [schemaType('CreativeWork'), BROAD_REFERENCE_TARGET]),
	matrixEntry('dataset', 'url', [primitive('url')]),
	matrixEntry('defined-term', 'hasDescription', [primitive('string')]),
	matrixEntry('defined-term', 'url', [primitive('url')]),
	matrixEntry('defined-term', 'hasCategory', [classification('defined-term')]),
	matrixEntry('defined-term', 'hasTag', [classification('defined-term')]),
	matrixEntry('ethereum-account', 'linkedAccount', [BROAD_ACCOUNT_TARGET]),
	matrixEntry('ethereum-erc20', 'listedOn', [
		classification('company'),
		classification('software'),
		classification('software-application'),
	]),
	matrixEntry('ethereum-erc20', 'pricedIn', [
		classification('ethereum-erc20'),
		classification('defined-term'),
	]),
	matrixEntry('ethereum-erc20', 'backedBy', [
		classification('ethereum-erc20'),
		classification('defined-term'),
	]),
	matrixEntry('ethereum-smart-contract', 'implement', [classification('defined-term')]),
	matrixEntry('ethereum-smart-contract', 'governedBy', [
		classification('defined-term'),
		classification('ethereum-erc20'),
		classification('company'),
	]),
	matrixEntry('ethereum-smart-contract', 'use', [BROAD_USAGE_TARGET]),
	matrixEntry('event', 'organizer', [classification('person'), classification('company')]),
	matrixEntry('event', 'performer', [
		classification('person'),
		classification('music-group'),
		classification('company'),
	]),
	matrixEntry('event', 'sponsoredBy', [classification('company')]),
	matrixEntry('event', 'subEvent', [classification('event')]),
	matrixEntry('event', 'superEvent', [classification('event')]),
	matrixEntry('event', 'locatedIn', [classification('location')]),
	matrixEntry('image', 'authoredBy', [classification('person')]),
	matrixEntry('image', 'createdBy', [classification('person'), classification('company')]),
	matrixEntry('image', 'url', [primitive('url')]),
	matrixEntry('image', 'imgUrl', [primitive('url')]),
	matrixEntry('image', 'hasTag', [classification('defined-term')]),
	matrixEntry('image', 'hasCategory', [classification('defined-term')]),
	matrixEntry('job-posting', 'hiringOrganization', [classification('company')]),
	matrixEntry('job-posting', 'jobLocation', [classification('location')]),
	matrixEntry('job-posting', 'url', [primitive('url')]),
	matrixEntry('job-posting', 'hasTag', [classification('defined-term')]),
	matrixEntry('local-business', 'branchOf', [
		classification('local-business'),
		classification('company'),
	]),
	matrixEntry('local-business', 'containedInPlace', [
		classification('location'),
		classification('local-business'),
	]),
	matrixEntry('local-business', 'containsPlace', [
		classification('location'),
		classification('local-business'),
	]),
	matrixEntry('local-business', 'locatedIn', [classification('location')]),
	matrixEntry('local-business', 'url', [primitive('url')]),
	matrixEntry('location', 'containedInPlace', [
		classification('location'),
		classification('local-business'),
	]),
	matrixEntry('location', 'containsPlace', [
		classification('location'),
		classification('local-business'),
	]),
	matrixEntry('location', 'locatedIn', [classification('location')]),
	matrixEntry('location', 'url', [primitive('url')]),
	matrixEntry('location', 'imgUrl', [primitive('url')]),
	matrixEntry('mobile-application', 'availableOn', [
		classification('software'),
		classification('software-application'),
		classification('defined-term'),
	]),
	matrixEntry('mobile-application', 'url', [primitive('url')]),
	matrixEntry('mobile-application', 'imgUrl', [primitive('url')]),
	matrixEntry('mobile-application', 'hasCategory', [classification('defined-term')]),
	matrixEntry('music-album', 'byArtist', [classification('music-group'), classification('person')]),
	matrixEntry('music-album', 'track', [classification('music-recording')]),
	matrixEntry('music-album', 'contain', [classification('music-recording'), BROAD_CONTAIN_TARGET]),
	matrixEntry('music-album', 'hasCategory', [classification('defined-term')]),
	matrixEntry('music-group', 'musicGroupMember', [classification('person')]),
	matrixEntry('music-group', 'track', [classification('music-recording')]),
	matrixEntry('music-group', 'contain', [BROAD_CONTAIN_TARGET]),
	matrixEntry('music-group', 'hasCategory', [classification('defined-term')]),
	matrixEntry('news-article', 'authoredBy', [classification('person')]),
	matrixEntry('news-article', 'publisher', [classification('company')]),
	matrixEntry('news-article', 'reference', [schemaType('CreativeWork'), BROAD_REFERENCE_TARGET]),
	matrixEntry('news-article', 'listedIn', [schemaType('Collection')], {
		notes: 'Use until Intuition promotes a first-class collection/list classification.',
	}),
	matrixEntry('news-article', 'url', [primitive('url')]),
	matrixEntry('news-article', 'hasCategory', [classification('defined-term')]),
	matrixEntry('podcast-episode', 'partOfSeries', [classification('podcast-series')]),
	matrixEntry('podcast-episode', 'url', [primitive('url')]),
	matrixEntry('podcast-episode', 'productionCompany', [classification('company')]),
	matrixEntry('podcast-episode', 'trailer', [classification('video-object')]),
	matrixEntry('podcast-series', 'url', [primitive('url')]),
	matrixEntry('podcast-series', 'createdBy', [classification('person'), classification('company')]),
	matrixEntry('podcast-series', 'publisher', [classification('company')]),
	matrixEntry('podcast-series', 'hasCategory', [classification('defined-term')]),
	matrixEntry('podcast-series', 'actor', [classification('person')]),
	matrixEntry('product', 'brand', [classification('brand')]),
	matrixEntry('product', 'manufacturer', [classification('company')]),
	matrixEntry('product', 'hasCategory', [classification('defined-term')]),
	matrixEntry('review', 'itemReviewed', [BROAD_REVIEW_TARGET]),
	matrixEntry('review', 'authoredBy', [classification('person')]),
	matrixEntry('service', 'provider', [classification('person'), classification('company')]),
	matrixEntry('service', 'areaServed', [classification('location')]),
	matrixEntry('service', 'hasCategory', [classification('defined-term')]),
	matrixEntry('service', 'url', [primitive('url')]),
	matrixEntry('social-media-account', 'linkedAccount', [BROAD_ACCOUNT_TARGET]),
	matrixEntry('social-media-account', 'url', [primitive('url')]),
	matrixEntry('social-media-account', 'availableOn', [
		classification('software'),
		classification('software-application'),
		classification('defined-term'),
	]),
	matrixEntry('social-media-posting', 'authoredBy', [
		classification('social-media-account'),
		classification('person'),
	]),
	matrixEntry('social-media-posting', 'reference', [BROAD_REFERENCE_TARGET]),
	matrixEntry('social-media-posting', 'url', [primitive('url')]),
	matrixEntry('social-media-posting', 'hasTag', [classification('defined-term')]),
	matrixEntry('software', 'createdBy', [classification('person'), classification('company')]),
	matrixEntry('software', 'url', [primitive('url')]),
	matrixEntry('software', 'implement', [classification('defined-term')]),
	matrixEntry('software', 'compatibleWith', [
		classification('software'),
		classification('software-application'),
		classification('defined-term'),
	]),
	matrixEntry('software-application', 'imgUrl', [primitive('url')]),
	matrixEntry('thing', 'url', [primitive('url')]),
	matrixEntry('thing', 'imgUrl', [primitive('url')]),
	matrixEntry('thing', 'hasDescription', [primitive('string')]),
	matrixEntry('tv-series', 'actor', [classification('person')]),
	matrixEntry('tv-series', 'director', [classification('person')]),
	matrixEntry('tv-series', 'productionCompany', [classification('company')]),
	matrixEntry('tv-series', 'trailer', [classification('video-object')]),
	matrixEntry('video-object', 'actor', [classification('person')]),
	matrixEntry('video-object', 'director', [classification('person')]),
	matrixEntry('video-object', 'musicBy', [classification('music-group'), classification('person')]),
	matrixEntry('video-object', 'productionCompany', [classification('company')]),
	matrixEntry('video-object', 'hasDescription', [primitive('string')]),
	matrixEntry('video-object', 'url', [primitive('url')]),
	matrixEntry('video-object', 'imgUrl', [primitive('url')]),
	matrixEntry('web-page', 'listedIn', [schemaType('Collection')], {
		notes: 'Use until Intuition promotes a first-class collection/list classification.',
	}),
	matrixEntry('web-page', 'authoredBy', [classification('person')]),
	matrixEntry('web-page', 'imgUrl', [primitive('url')]),
	matrixEntry('web-page', 'url', [primitive('url')]),
	matrixEntry('web-site', 'publisher', [classification('company')]),
	matrixEntry('web-site', 'createdBy', [classification('person'), classification('company')]),
	matrixEntry('web-site', 'hasTag', [classification('defined-term')]),
	matrixEntry('web-site', 'hasCategory', [classification('defined-term')]),
	matrixEntry('web-site', 'url', [primitive('url')]),
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
	...MATRIX_COVERAGE_ENTRIES,
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
