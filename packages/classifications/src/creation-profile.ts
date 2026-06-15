import type {
	ExpectedObject,
	MetadataPredicatePriority,
	SchemaMapping,
} from './metadata-predicate-matrix.js';
import type { ClassificationCategory, FieldType } from './types.js';

export type CreationPredicateMarketPattern = 'depositional' | 'attributive' | 'comparative';
export type CreationPredicateStatus = 'enshrined' | 'proposed' | 'deprecated';

export interface CreationProfileClassification {
	slug: string;
	type: string;
	displayName: string;
	description: string;
	category: ClassificationCategory;
	schema: {
		context: string;
		type: string;
	} | null;
}

export interface CreationFieldSchemaProvenance {
	context: string;
	property: string;
	propertyId: string;
	label: string;
	comment: string;
	originType: string;
	originTypeId: string;
	rangeIncludes: readonly string[];
}

export interface CreationField {
	key: string;
	label: string;
	description: string;
	fieldType: FieldType;
	required: boolean;
	placeholder?: string;
	schemaProperty?: string;
	schema: CreationFieldSchemaProvenance | null;
}

export interface CreationPredicateSummary {
	key: string;
	id: string;
	label: string;
	description: string;
	status: CreationPredicateStatus;
	category: string;
	marketPattern: CreationPredicateMarketPattern;
}

export interface CreationRelationship {
	subjectClassification: string;
	predicate: CreationPredicateSummary;
	expectedObjects: readonly ExpectedObject[];
	schemaMappings?: readonly SchemaMapping[];
	priority?: MetadataPredicatePriority;
	notes?: string;
}

export interface CreationProfile {
	classification: CreationProfileClassification;
	fields: readonly CreationField[];
	relationships: readonly CreationRelationship[];
	availableFieldCount?: number;
}
