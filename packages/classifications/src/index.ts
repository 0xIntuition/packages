export {
	type BuildAtomDataOptions,
	buildAtomData,
	buildAtomDataObject,
	deriveClassificationIdentifier,
	validateClassificationValues,
} from './atom-data.js';
export {
	buildClassificationReferenceResolver,
	CLASSIFICATION_SLUGS,
	CLASSIFICATION_SPECS,
	getClassification,
	getClassificationByReference,
	getClassificationByType,
	getClassificationLabel,
	getClassificationsByCategory,
	getMetadataPredicatesFor,
	hasClassification,
	identityLadderFor,
} from './classifications.js';
export type {
	CreationField,
	CreationFieldSchemaProvenance,
	CreationPredicateMarketPattern,
	CreationPredicateStatus,
	CreationPredicateSummary,
	CreationProfile,
	CreationProfileClassification,
	CreationRelationship,
} from './creation-profile.js';
export {
	IDENTITY_SCHEME_CLASS,
	IDENTITY_SCHEME_TYPING,
	rungClass,
	topRungAnchorEligible,
} from './identity.js';
export { IDENTITY_FIELD_SCHEMA_ORG_ALIASES } from './identity-field-aliases.js';
export type {
	ExpectedObject,
	MetadataPredicateMatrixEntry,
	MetadataPredicatePriority,
	PrimitiveValueType,
	SchemaMapping,
	SchemaMappingMatch,
} from './metadata-predicate-matrix.js';
export {
	getMetadataPredicateMatrixFor,
	getMetadataPredicateRelation,
	METADATA_PREDICATE_MATRIX,
} from './metadata-predicate-matrix.js';
export {
	isNativeAtomClassificationType,
	NATIVE_ATOM_CLASSIFICATION_TYPES,
	nativeAtomClassificationTypeForData,
} from './native-atom-types.js';
export {
	buildClassificationSearchText,
	CLASSIFICATION_SEARCH_TEXT_MAX_LENGTH,
} from './search-text.js';
export type {
	AtomCategory,
	ClassificationCategory,
	ClassificationFieldSpec,
	ClassificationSpec,
	ClassificationValidationIssue,
	ClassificationValueMap,
	FieldType,
	IdentityClass,
	IdentityDerivationName,
	IdentityRecipeField,
	IdentityRung,
	IdentitySchemeName,
	IdentitySpec,
	IdentityValueSource,
	PredicateKeyReference,
} from './types.js';
export {
	ALL_ATOMS_VISIBILITY,
	ATOM_VISIBILITY_MODES,
	type AtomVisibilityMode,
	type ClassificationVisibilityPreset,
	filterClassificationSpecsForPrimaryCatalogue,
	isClassificationTypeInPrimaryCatalogue,
	PRIMARY_ITEM_CATALOGUE_PRESET,
	PRIMARY_ITEM_CATALOGUE_VISIBILITY,
	type ResolvedAtomVisibilityFilters,
	resolveAtomVisibilityFilters,
} from './visibility-presets.js';

/** Canonical Discover activity membership, shared by the read and its shelves. */
export const DISCOVER_ACTIVITY_GROUPS = {
	read: ['Book'],
	watch: ['Movie', 'TVSeries', 'TVEpisode'],
	listen: ['MusicRecording', 'MusicAlbum', 'PodcastSeries', 'PodcastEpisode'],
} as const;
