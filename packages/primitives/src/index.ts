// ID utilities

export type {
	ClassificationCategory,
	ClassificationFieldSpec,
	ClassificationSpec,
	ClassificationValidationIssue,
	ClassificationValueMap,
	FieldType,
} from '@0xintuition/classifications';
// Classification registry (re-exported from @0xintuition/classifications)
export {
	buildAtomData,
	buildAtomDataObject,
	CLASSIFICATION_SLUGS,
	CLASSIFICATION_SPECS,
	getClassification,
	getClassificationsByCategory,
	hasClassification,
	validateClassificationValues,
} from '@0xintuition/classifications';
export type { AtomId, CounterTripleId, PredicateAtomDocument, TripleId } from '@0xintuition/ids';
export {
	ATOM_SALT,
	assertValidHash,
	COUNTER_SALT,
	calculateAtomId,
	calculateCounterTripleId,
	calculatePredicateId,
	calculateTripleId,
	checksumAddress,
	createPredicateAtomData,
	formatTrustAmount,
	hashHex,
	hashPacked,
	isValidAtomId,
	isValidCounterTripleId,
	isValidTripleId,
	PREDICATE_DEFINED_TERM_TYPE,
	PREDICATE_SCHEMA_CONTEXT,
	shortenHex,
	TRIPLE_SALT,
} from '@0xintuition/ids';
// Atom builders
export {
	buildAggregateRating,
	buildArticle,
	buildAtom,
	buildBook,
	buildBrand,
	buildComment,
	buildCompany,
	buildDataset,
	buildDefinedTerm,
	buildERC20Token,
	buildEthereumAccount,
	buildEvent,
	buildImage,
	buildJobPosting,
	buildLocalBusiness,
	buildLocation,
	buildMobileApplication,
	buildMovie,
	buildMusicAlbum,
	buildMusicGroup,
	buildMusicRecording,
	buildNewsArticle,
	buildPerson,
	buildPodcastEpisode,
	buildPodcastSeries,
	buildProduct,
	buildReview,
	buildService,
	buildSmartContract,
	buildSocialMediaAccount,
	buildSocialMediaPosting,
	buildSoftware,
	buildSoftwareApplication,
	buildThing,
	buildTVSeries,
	buildVideoObject,
	buildWebPage,
	buildWebSite,
} from './atom.js';
// Discovery helpers
export {
	getClassificationFields,
	getRequiredFields,
	listClassifications,
	suggestClassification,
} from './discover.js';

// Predicate helpers
export { buildCustomPredicate, getPredicateInfo, listPredicates } from './predicate.js';
// Triple builders
export { buildCounterTriple, buildTriple, buildTripleByName } from './triple.js';
// Types
export type {
	AtomBlueprint,
	BuildResult,
	ClassificationSummary,
	CounterTripleBlueprint,
	FieldInfo,
	PredicateInfo,
	TripleBlueprint,
	ValidationResult,
} from './types.js';
// Validation helpers
export { isValidAtomData, validateAtom } from './validate.js';
