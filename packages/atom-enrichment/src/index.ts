export type { CacheAdapter, CachedEntry } from './cache';
export {
	buildCacheKey,
	createMemoryCacheAdapter,
	createUpstashCacheAdapter,
	createUpstashCacheAdapterFromEnv,
	isCachedEntryFresh,
	NO_IDENTITY_POLICY_MARKER,
} from './cache';
export type {
	ClassificationCategory,
	ClassificationDefinition,
	ClassificationRegistry,
	RegisterClassificationOptions,
} from './classifications';
export {
	builtinClassificationDefinitions,
	classificationCategorySchema,
	classificationSlugSchema,
	createClassificationRegistry,
	createDefaultClassificationRegistry,
	listBuiltinClassificationSlugs,
	registerBuiltinClassifications,
} from './classifications';
export type {
	CorpusProjectionArtifact,
	OpenLibraryProjectionPayload,
	ProjectCorpusDataResolvedInput,
} from './corpus-data-resolved-projection';
export {
	parseOpenLibraryProjectionPayload,
	projectCorpusDataResolvedFromArtifacts,
	resolveCorpusProjectionNameFromArtifacts,
} from './corpus-data-resolved-projection';
export type { DataResolved } from './data-resolved-schema';
export {
	DATA_RESOLVED_MAX_BYTES,
	dataResolvedSchema,
	IDENTIFIER_RUNG_MAX_ITEMS,
	sanitizeMaterializedDataResolved,
} from './data-resolved-schema';
export { redactProviderDiagnostic } from './diagnostics';
export type { EnrichmentEngine, EnrichmentEngineConfig } from './engine';
export { createEnrichmentEngine } from './engine';
export type {
	FacetMergePolicy,
	FacetRegistryEntry,
	MaterializedField,
	MaterializedIdentityRungToken,
} from './facet-registry';
export {
	FACET_REGISTRY,
	IDENTITY_RUNG_TOKENS,
	MATERIALIZED_FIELDS,
} from './facet-registry';
export type { ClassificationResultLike } from './handoff';
export {
	normalizeResolvedClassificationInput,
	resolveClassifiedAtomPolicy,
	resolvePreferredEnrichmentUrl,
	toClassifiedAtomInput,
} from './handoff';
export {
	isIdentifierRungAllowed,
	mergeAdmittedIdentifierRungs,
	type ProjectedIdentifierRung,
	type ProjectIdentifierRungsInput,
	projectIdentifierRungs,
} from './identifier-rung-projection';
export type {
	IidDataResolvedProjection,
	ProjectIidDataResolvedInput,
} from './iid-data-resolved-projection';
export { projectIidDataResolvedFromArtifacts } from './iid-data-resolved-projection';
export type {
	OpenGraphPageAuthorization,
	OpenGraphPageSourceRule,
	PublicResolvedAddress,
	ResolvePublicHostname,
} from './image-policy';
export {
	authorizeOpenGraphPageSource,
	IMAGE_PROVENANCE_FIELDS,
	isAdmissibleMaterializedImage,
	isAdmissibleMaterializedImageWithDns,
	isAllowedOpenGraphPageSource,
	isPublicHttpsUrl,
	isPublicHttpsUrlWithDns,
	isPublicHttpUrlWithDns,
	OPEN_GRAPH_PAGE_SOURCE_RULES,
	readHttpUrl,
	selectPermissiveImage,
} from './image-policy';
export type {
	MaterializeNodeDataResolvedInput,
	NodeMaterializationArtifact,
	NodeMaterializationClassification,
} from './materialize-node-data-resolved';
export {
	materializeNodeDataResolved,
	materializeProcessDataResolved,
} from './materialize-node-data-resolved';
export { enrichOutcome } from './outcome';
export type {
	EnrichmentPluginRegistry,
	RegisterPluginOptions,
	ResolvePluginsResult,
} from './plugin-registry';
export { createEnrichmentPluginRegistry } from './plugin-registry';
export type {
	EnrichmentPlugin,
	EnrichmentPluginContext,
	EnrichmentPluginLogger,
	EnrichmentPluginManifest,
	ParsedEnrichmentPluginManifest,
} from './plugins';
export {
	defineEnrichmentPlugin,
	enrichmentPluginManifestSchema,
	isPluginRuntimeCompatible,
	validateEnrichmentPluginManifest,
} from './plugins';
export type { FetchLike } from './plugins/providers';
export {
	createBrandPlugin,
	createCoinGeckoPlugin,
	createCrossrefPlugin,
	createEtherscanPlugin,
	createFaviconPlugin,
	createGitHubPlugin,
	createLetterboxdPlugin,
	createMusicBrainzPlugin,
	createNpmPlugin,
	createOEmbedPlugin,
	createOpenGraphPlugin,
	createOpenLibraryPlugin,
	createProductListingPlugin,
	createSpotifyPlugin,
	createSteamPlugin,
	createTmdbPlugin,
	createWikidataPlugin,
	createWikipediaPlugin,
	createXProfilePlugin,
	createYouTubePlugin,
	PROVIDER_HTTP_BODY_EXCERPT_MAX_CHARS,
	ProviderHttpError,
	parseRetryAfterMs,
} from './plugins/providers';
export { GOODREADS_PLACEHOLDER_TITLE_PATTERN } from './plugins/providers/__shared__/request';
export { schemaTypesAgree } from './plugins/providers/__shared__/wikidata-type';
export type {
	AcademicPresetOptions,
	CompanyPresetOptions,
	CryptoPresetOptions,
	EnrichmentPreset,
	MusicPresetOptions,
	ServerDefaultPresetEnvironment,
	ServerDefaultPresetOptions,
} from './presets';
export {
	academicPreset,
	companyPreset,
	createServerDefaultPresetOptions,
	cryptoPreset,
	musicPreset,
	serverDefaultPreset,
} from './presets';
export type {
	CanopyAmazonProduct,
	CanopyAmazonProductResponse,
	GitHubRepoResponse,
	GitHubUserResponse,
	OpenLibraryAuthorResponse,
	OpenLibraryEntityResponse,
	SpotifyAlbumResponse,
	SpotifyArtistResponse,
	SpotifyEpisodeResponse,
	SpotifyPlaylistResponse,
	SpotifyShowResponse,
	SpotifyTokenResponse,
	SpotifyTrackResponse,
	SteamAppDetailsResponse,
	XPublicMetricsResponse,
	XUserLookupResponse,
	XUserLookupUser,
} from './provider-external-data';
export {
	canopyAmazonProductResponseSchema,
	canopyAmazonProductSchema,
	gitHubRepoResponseSchema,
	gitHubUserResponseSchema,
	openLibraryAuthorResponseSchema,
	openLibraryEntityResponseSchema,
	spotifyAlbumResponseSchema,
	spotifyArtistResponseSchema,
	spotifyEpisodeResponseSchema,
	spotifyPlaylistResponseSchema,
	spotifyShowResponseSchema,
	spotifyTokenResponseSchema,
	spotifyTrackResponseSchema,
	steamAppDetailsResponseSchema,
	xPublicMetricsResponseSchema,
	xUserLookupResponseSchema,
	xUserLookupUserSchema,
} from './provider-external-data';
export type {
	CreateIdentifierProviderPlanInput,
	IdentifierProviderPlan,
	IdentifierProviderPlanEntry,
	IidProviderCapability,
	IidProviderSlug,
} from './provider-plan';
export {
	createIdentifierProviderPlan,
	IID_PROVIDER_CAPABILITIES,
	IID_PROVIDER_SLUGS,
} from './provider-plan';
export {
	canonicalizeEnrichmentSlug,
	canonicalizeEnrichmentSlugs,
	expandEnrichmentSlugAliases,
	expandEnrichmentSlugAliasesList,
} from './slug-aliases';
export type { TmdbTitleProjectionArtifact } from './tmdb-title-projection';
export { projectTmdbTitleFromArtifacts } from './tmdb-title-projection';
export type {
	AmazonTarget,
	AtomType,
	ClassifiedAtomIdentifier,
	ClassifiedAtomInput,
	ClassifiedAtomPolicy,
	ClassifiedAtomTargets,
	EnrichmentArtifact,
	EnrichmentArtifactMeta,
	EnrichmentIdentityCapability,
	EnrichmentIdentityPolicy,
	EnrichmentPipelineResult,
	EnrichmentRequest,
	EnrichmentRequestInput,
	EnrichmentRunResult,
	EnrichmentRuntime,
	EnrichmentSkippedPlugin,
	EnrichRunOptions,
	GitHubTarget,
	HttpErrorDetails,
	PluginExecutionError,
	PluginExecutionErrorCode,
	PluginRuntime,
	ProviderHttpErrorDetails,
	ProviderPrefetch,
	RawInputKind,
	SlotRefusalErrorDetails,
	SpotifyPrefetchedItem,
	XTarget,
} from './types';
export {
	amazonTargetSchema,
	atomTypeSchema,
	BUDGET_EXHAUSTED_ERROR_CLASS,
	classifiedAtomIdentifierSchema,
	classifiedAtomInputSchema,
	classifiedAtomPolicySchema,
	classifiedAtomTargetsSchema,
	enrichmentArtifactMetaSchema,
	enrichmentArtifactSchema,
	enrichmentRequestSchema,
	enrichmentRunResultSchema,
	enrichmentRuntimeSchema,
	githubTargetSchema,
	httpErrorDetailsSchema,
	pluginExecutionErrorCodeSchema,
	pluginExecutionErrorSchema,
	pluginRuntimeSchema,
	providerHttpErrorDetailsSchema,
	providerPrefetchSchema,
	rawInputKindSchema,
	slotRefusalErrorDetailsSchema,
	spotifyPrefetchedItemSchema,
	xTargetSchema,
} from './types';
