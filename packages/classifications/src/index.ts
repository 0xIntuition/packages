export { buildAtomData, buildAtomDataObject, validateClassificationValues } from './atom-data.js';
export {
	CLASSIFICATION_SLUGS,
	CLASSIFICATION_SPECS,
	getClassification,
	getClassificationsByCategory,
	getMetadataPredicatesFor,
	hasClassification,
} from './classifications.js';
export type {
	ClassificationCategory,
	ClassificationFieldSpec,
	ClassificationSpec,
	ClassificationValidationIssue,
	ClassificationValueMap,
	FieldType,
	PredicateKeyReference,
} from './types.js';
