export {
	SCHEMA_ORG_CONTEXT,
	SCHEMA_ORG_GENERATED_PROPERTY_COUNT,
	SCHEMA_ORG_GENERATED_TYPE_COUNT,
	SCHEMA_ORG_RELEASE_DATE,
	SCHEMA_ORG_SOURCE_URL,
	SCHEMA_ORG_TYPES,
	SCHEMA_ORG_VERSION,
} from './generated/index.js';
export {
	getPropertiesFor,
	getType,
	hasType,
	listTypes,
	normalizeSchemaOrgName,
} from './schema-org.js';
export type {
	ResolvedSchemaOrgPropertySpec,
	SchemaOrgPropertySpec,
	SchemaOrgTypeSpec,
} from './types.js';
