export {
	IDENTITY_CATEGORIES,
	IDENTITY_CATEGORY_ALIAS_ONLY_POLICY,
	IDENTITY_CATEGORY_RUNG_POLICY,
	IDENTITY_RUNG_TOKENS,
	type IdentityCategory,
	type IdentityRungToken,
	identityRungsForCategory,
	isPlainWdPrimaryAllowed,
	resolveWikidataP31Identity,
	SCHEMA_TYPE_IDENTITY_CATEGORIES,
	schemeOrderForIdentityCategory,
	WIKIDATA_P31_IDENTITY_POLICY,
	type WikidataP31Identity,
} from './category-rungs.js';
export { iidForIdentityRung } from './identity-rung-iid.js';
export {
	IID_VALUE_MAX_LENGTH,
	type LadderInput,
	type LadderResult,
	projectIdentifierLadder,
} from './ladder.js';
export {
	INTENTIONALLY_UNMAPPED_PROVIDER_PREFIXES,
	PROVIDER_PREFIX_MAPPINGS,
	type ProviderLocalPrefixMapping,
	type ProviderPrefixMapping,
	type RegisteredProviderPrefixMapping,
	UNREGISTERED_PROVIDER_LOCAL_PREFIXES,
} from './provider-prefixes.js';
export {
	PINNED_ACTIVE_WD_P31_CLOSURE,
	PINNED_ACTIVE_WD_P31_CLOSURE_SHA256,
} from './wd-p31-closure.js';
export { pickWikidataLabel } from './wikidata-label.js';
