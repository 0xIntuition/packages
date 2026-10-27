export type FacetMergePolicy = 'union-provenance' | 'prefer-strongest';

export type FacetRegistryEntry = {
	readonly facet: string;
	readonly schemaOrgKey: string;
	readonly valueType: string;
	readonly bounds: Readonly<Record<string, unknown>>;
	readonly mergePolicy: FacetMergePolicy;
	readonly derivesTriples: boolean;
	readonly coverageGate?: number;
};

export type { IdentityRungToken as MaterializedIdentityRungToken } from '@0xintuition/iid-ladder';
export { IDENTITY_RUNG_TOKENS } from '@0xintuition/iid-ladder';

/**
 * Declarative materialization policy. Registry order is stable so projected
 * documents and contract snapshots remain deterministic.
 */
export const FACET_REGISTRY = [
	{
		facet: '@context',
		schemaOrgKey: '@context',
		valueType: 'string',
		bounds: { maxLength: 256 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: '@type',
		schemaOrgKey: '@type',
		valueType: 'string',
		bounds: { maxLength: 128 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'about',
		schemaOrgKey: 'about',
		valueType: 'string-array',
		bounds: { maxItems: 64, itemMaxLength: 256 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'author',
		schemaOrgKey: 'author',
		valueType: 'entity-or-entity-array',
		bounds: { maxItems: 12, nameMaxLength: 512 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'byArtist',
		schemaOrgKey: 'byArtist',
		valueType: 'entity-or-entity-array',
		bounds: { maxItems: 12, nameMaxLength: 512 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'datePublished',
		schemaOrgKey: 'datePublished',
		valueType: 'string',
		bounds: { maxLength: 256 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'description',
		schemaOrgKey: 'description',
		valueType: 'plain-text',
		bounds: { documentMaxBytes: 65_536 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'identifier',
		schemaOrgKey: 'identifier',
		valueType: 'string',
		bounds: { maxLength: 257 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'image',
		schemaOrgKey: 'image',
		valueType: 'public-https-url',
		bounds: { maxLength: 8192 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'inAlbum',
		schemaOrgKey: 'inAlbum',
		valueType: 'entity-or-entity-array',
		bounds: { maxItems: 12, nameMaxLength: 512 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'isbn',
		schemaOrgKey: 'isbn',
		valueType: 'string-or-string-array',
		bounds: { maxItems: 16, itemMaxLength: 256 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'isrcCode',
		schemaOrgKey: 'isrcCode',
		valueType: 'string',
		bounds: { maxLength: 256 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'name',
		schemaOrgKey: 'name',
		valueType: 'string',
		bounds: { maxLength: 512 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'sameAs',
		schemaOrgKey: 'sameAs',
		valueType: 'http-url-array',
		bounds: { maxItems: 32, itemMaxLength: 8192 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'url',
		schemaOrgKey: 'url',
		valueType: 'http-url',
		bounds: { maxLength: 8192 },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'identifierRung',
		schemaOrgKey: 'identifierRung',
		valueType: 'identifier-rung-array',
		bounds: { dedupeBy: 'rung+value', maxItems: 32 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'genre',
		schemaOrgKey: 'genre',
		valueType: 'wikidata-qid-array',
		bounds: { maxItems: 64 },
		mergePolicy: 'union-provenance',
		derivesTriples: true,
	},
	{
		facet: 'keywords',
		schemaOrgKey: 'keywords',
		valueType: 'string-array',
		bounds: { itemMaxLength: 128, maxItems: 64 },
		mergePolicy: 'union-provenance',
		derivesTriples: false,
	},
	{
		facet: 'duration',
		schemaOrgKey: 'duration',
		valueType: 'iso-8601-duration',
		bounds: { format: 'ISO-8601' },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'director',
		schemaOrgKey: 'director',
		valueType: 'name-or-qid-array',
		bounds: { maxItems: 32 },
		mergePolicy: 'union-provenance',
		derivesTriples: true,
	},
	{
		facet: 'actor',
		schemaOrgKey: 'actor',
		valueType: 'name-or-qid-array',
		bounds: { maxItems: 128 },
		mergePolicy: 'union-provenance',
		derivesTriples: true,
	},
	{
		facet: 'countryOfOrigin',
		schemaOrgKey: 'countryOfOrigin',
		valueType: 'string-array',
		bounds: { maxItems: 16 },
		mergePolicy: 'union-provenance',
		derivesTriples: true,
	},
	{
		facet: 'inLanguage',
		schemaOrgKey: 'inLanguage',
		valueType: 'string-array',
		bounds: { maxItems: 16 },
		mergePolicy: 'union-provenance',
		derivesTriples: true,
	},
	{
		facet: 'aggregateRating',
		schemaOrgKey: 'aggregateRating',
		valueType: 'aggregate-rating',
		bounds: { required: ['ratingValue'] },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'startDate',
		schemaOrgKey: 'startDate',
		valueType: 'iso-8601-date',
		bounds: { format: 'YYYY-MM-DD' },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'endDate',
		schemaOrgKey: 'endDate',
		valueType: 'iso-8601-date',
		bounds: { format: 'YYYY-MM-DD' },
		mergePolicy: 'prefer-strongest',
		derivesTriples: false,
	},
	{
		facet: 'isBasedOn',
		schemaOrgKey: 'isBasedOn',
		valueType: 'url-or-wikidata-qid-array',
		bounds: { itemMaxLength: 8192, maxItems: 32 },
		mergePolicy: 'union-provenance',
		derivesTriples: true,
	},
] as const satisfies readonly FacetRegistryEntry[];

export type MaterializedField = (typeof FACET_REGISTRY)[number]['schemaOrgKey'];

/** Schema allowlist derived from the registry so the two contracts cannot drift. */
export const MATERIALIZED_FIELDS: ReadonlySet<MaterializedField> = new Set(
	FACET_REGISTRY.map((entry) => entry.schemaOrgKey)
);
