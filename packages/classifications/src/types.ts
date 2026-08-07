export type FieldType =
	| 'string'
	| 'url'
	| 'number'
	| 'integer'
	| 'address'
	| 'string[]'
	| 'iso-date'
	| 'iso-datetime';

export interface ClassificationFieldSpec {
	key: string;
	label: string;
	description: string;
	fieldType: FieldType;
	required: boolean;
	placeholder?: string;
	schemaProperty?: string;
}

export type PredicateKeyReference = string;

export type ClassificationCategory =
	| 'Entity'
	| 'Creative Work'
	| 'Media'
	| 'Product'
	| 'Web'
	| 'Blockchain'
	| 'Other';

// --- Identity (Intuition ID spec) -----------------------------------------
//
// Each classification declares an ordered identity ladder (IID spec §4):
// strongest identification first. Minting derives the `identifier` from the
// highest rung whose data is available. Ladders are DECLARATIVE data — a
// derivation engine interprets the sources; nothing here executes.
//
// Ladder rules (source of truth: intuition-v2 `.planning/intuition-id/`):
// - D21: gen1 recipes never hash free-text names of RELATED entities
//   (author, byArtist, brand, employer) — relationships are triples.
// - D22: gen1 rung tags are stable recipe identifiers, frozen forever.
//   Inserting a rung assigns a fresh tag; tags never renumber.
// - Rungs are all-or-nothing: a rung fires only when every input it names
//   is present and canonicalizes.

/** How strongly a scheme pins its entity (IID spec §3). */
export type IdentityClass = 'A' | 'B' | 'C';

/** The governed scheme registry (IID scheme-registry.md). */
export type IdentitySchemeName =
	| 'isbn'
	| 'isrc'
	| 'iswc'
	| 'isni'
	| 'orcid'
	| 'lei'
	| 'gtin'
	| 'doi'
	| 'eidr'
	| 'wd'
	| 'mbid'
	| 'olid'
	| 'imdb'
	| 'tmdb'
	| 'podcastguid'
	| 'url'
	| 'caip10'
	| 'caip19'
	| 'hash'
	| 'appid'
	| 'purl'
	| 'geo'
	| 'acct'
	| 'rssitem'
	| 'termset'
	| 'gen1';

/**
 * Named multi-field derivations. Each name is a frozen contract the
 * derivation engine implements (value shapes per scheme-registry.md).
 */
export type IdentityDerivationName =
	| 'acct-strong' // <platform>:<platformUserId> — immutable platform user id
	| 'acct-weak' // <platform>:@<username> — handles rename/recycle; ranks lower
	| 'appid-bundle' // <operatingSystem>:<bundleId>
	| 'rss-item' // <feedGuid>:<keccak16(NORM-1(itemGuid))>
	| 'termset-term' // <keccak16(NORM-1(inDefinedTermSet))>:<slug(termCode)>
	| 'caip10-eoa' // eip155:1:<address> — D24: EOAs are chain-agnostic
	| 'caip10-contract' // eip155:<chainId>:<address>
	| 'caip19-erc20'; // eip155:<chainId>/erc20:<address>

/** Where a scheme rung reads its raw value. */
export type IdentityValueSource =
	| { readonly kind: 'field'; readonly key: string }
	| { readonly kind: 'same-as' } // scan sameAs URLs through the scheme's canonicalizer
	| { readonly kind: 'url-origin'; readonly key: string } // origin of a URL field
	| { readonly kind: 'geohash'; readonly precision: number } // from latitude + longitude
	| { readonly kind: 'podcast-guid'; readonly key: string } // RFC 4122 v5 over a feed URL
	| { readonly kind: 'derivation'; readonly name: IdentityDerivationName };

/** One hashed input of a gen1 recipe. `key` is the preimage key (spec §5.1). */
export type IdentityRecipeField =
	| { readonly key: string; readonly from: 'field' } // NORM-1(field value); field key === preimage key
	| { readonly key: string; readonly from: 'year'; readonly of: string } // YYYY of an ISO date field
	| { readonly key: string; readonly from: 'text-hash'; readonly of: string } // keccak16(NORM-1(value))
	| { readonly key: string; readonly from: 'geohash'; readonly precision: number };

export type IdentityRung =
	| {
			readonly kind: 'scheme';
			readonly scheme: Exclude<IdentitySchemeName, 'gen1'>;
			readonly source: IdentityValueSource;
			readonly note?: string;
	  }
	| {
			readonly kind: 'gen1';
			readonly tag: number; // D22: stable recipe id — frozen, never renumbered
			readonly recipe: readonly IdentityRecipeField[];
			readonly note?: string;
	  };

export interface IdentitySpec {
	/** The ontological level this classification identifies (one atom per level). */
	readonly identifies: string;
	/** Ordered strongest-first: Class A ≥ B ≥ C. */
	readonly ladder: readonly IdentityRung[];
}

export interface ClassificationSpec {
	slug: string;
	type: string;
	displayName: string;
	description: string;
	category: ClassificationCategory;
	schema: {
		context: string;
		type: string;
	} | null;
	fields: readonly ClassificationFieldSpec[];
	metadataPredicates: readonly PredicateKeyReference[];
	defaults: {
		pluginId: string;
		provider?: string;
	};
	/**
	 * The formalized identity spec, or null when the classification is
	 * deliberately outside IID scope (e.g. aggregate-rating, remodeled as a
	 * triple — D23).
	 */
	identity: IdentitySpec | null;
}

export type ClassificationValueMap = Record<string, unknown>;

export interface ClassificationValidationIssue {
	field?: string;
	message: string;
}
