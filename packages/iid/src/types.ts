/**
 * Intuition Identifier (IID) type surface.
 *
 * An IID is a deterministic, canonicalized identifier string of the shape
 * `int:<scheme>:<value>`, embedded in atom data as the system-wide
 * de-duplication key. Normative specification: `@0xintuition/iid-spec`.
 *
 * The identity-ladder contract here is DECLARATIVE: rungs describe where
 * values come from as serializable data (field keys, derivation names,
 * recipe field specs), never as executable callbacks. The derivation engine
 * in `derive.ts` interprets these declarations as a pure function. This is
 * what lets ladders live in generated classification data, travel through
 * JSON, and be audited without running code.
 */

/** Every IID starts with the `int:` namespace followed by a registered scheme. */
export type IntuitionId = `int:${string}:${string}`;

/** An IID narrowed to a specific scheme, e.g. `Iid<'isbn'>` = `int:isbn:${string}`. */
export type Iid<S extends SchemeName> = `int:${S}:${string}`;

/**
 * Identity class of a scheme (spec §3):
 * - `A` — registered external authority (ISBN, ISNI, LEI, ...). Strongest.
 * - `B` — intrinsic natural key (URL, chain address, content hash, ...).
 * - `C` — derived composite hash (`gen1`). Weakest; ambiguous by construction.
 */
export type IdentityClass = 'A' | 'B' | 'C';

export const SCHEME_NAMES = [
	'isbn',
	'isrc',
	'iswc',
	'isni',
	'orcid',
	'lei',
	'gtin',
	'doi',
	'eidr',
	'wd',
	'mbid',
	'olid',
	'imdb',
	'tmdb',
	'podcastguid',
	'url',
	'caip10',
	'caip19',
	'hash',
	'appid',
	'purl',
	'geo',
	'acct',
	'rssitem',
	'termset',
	'gen1',
] as const;

export type SchemeName = (typeof SCHEME_NAMES)[number];

/** A scheme other than the derived `gen1` scheme. */
export type ExternalSchemeName = Exclude<SchemeName, 'gen1'>;

/** Whether a bare IID of a scheme implies its entity type (spec §7.3). */
export type SchemeTyping = 'unambiguous' | 'polymorphic';

export interface SchemeDefinition {
	readonly scheme: SchemeName;
	readonly class: IdentityClass;
	/**
	 * Normalize raw input into the scheme's canonical value form, or return
	 * `undefined` when the input cannot be a valid value for this scheme.
	 * Pure and offline: no network I/O, ever.
	 */
	readonly canonicalize: (raw: string) => string | undefined;
	/** Check that a value is already in canonical form. */
	readonly isCanonical: (value: string) => boolean;
}

// ---------------------------------------------------------------------------
// Declarative identity ladders (spec §5)
// ---------------------------------------------------------------------------

/** Field values provided when deriving an IID (classification field map). */
export type IidValueMap = Readonly<Record<string, unknown>>;

/**
 * Named multi-field derivations. Each name is a frozen contract the
 * derivation engine implements; the field keys each name reads are part of
 * that contract and documented on the engine.
 */
export type IdentityDerivationName =
	| 'acct-strong' // <platform>:<platformUserId> — immutable platform user id
	| 'acct-weak' // <platform>:@<username> — handles rename/recycle; ranks lower
	| 'appid-bundle' // <operatingSystem>:<bundleId>
	| 'rss-item' // <feedGuid>:<keccak16(NORM-1(itemGuid))>
	| 'termset-term' // <keccak16(NORM-1(inDefinedTermSet))>:<slug(termCode)>
	| 'caip10-eoa' // eip155:1:<address> — EOAs are chain-agnostic
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

/** One hashed input of a gen1 recipe. `key` is the preimage key (spec §6.3). */
export type IdentityRecipeField =
	| { readonly key: string; readonly from: 'field' } // NORM-1(field value); field key === preimage key
	| { readonly key: string; readonly from: 'year'; readonly of: string } // YYYY of an ISO date field
	| { readonly key: string; readonly from: 'text-hash'; readonly of: string } // keccak16(NORM-1(value))
	| { readonly key: string; readonly from: 'geohash'; readonly precision: number };

/**
 * A ladder rung. Scheme rungs (Class A/B) declare where their raw value
 * comes from; `gen1` rungs (Class C) declare the recipe they hash.
 *
 * `tag` is the rung's STABLE recipe identifier (spec §6.4): frozen at recipe
 * creation and never renumbered, even when the ladder later gains rungs.
 * Recipes are all-or-nothing: a rung fires only when every field resolves.
 */
export type IdentityRung =
	| {
			readonly kind: 'scheme';
			readonly scheme: ExternalSchemeName;
			readonly source: IdentityValueSource;
			readonly note?: string;
	  }
	| {
			readonly kind: 'gen1';
			readonly tag: number;
			readonly recipe: readonly IdentityRecipeField[];
			readonly note?: string;
	  };

/**
 * A classification's identity ladder: ordered strongest-first. Derivation
 * uses the highest rung whose data is available (spec §5.2).
 */
export interface IdentityLadder {
	/** Classification slug — namespaces gen1 hashes (spec §6.2). */
	readonly slug: string;
	/** Which ontological level the classification identifies (spec §5.5). */
	readonly identifies: string;
	readonly rungs: readonly IdentityRung[];
}

export interface DerivedIid {
	readonly iid: IntuitionId;
	readonly scheme: SchemeName;
	readonly class: IdentityClass;
	/** Stable rung tag when the IID came from a gen1 rung. */
	readonly tag?: number;
}

export interface ParsedIid {
	readonly scheme: SchemeName;
	readonly value: string;
}

// ---------------------------------------------------------------------------
// Typed inspection results (spec §2.5, §7.2)
// ---------------------------------------------------------------------------

/**
 * Why an input failed inspection:
 * - `malformed` — does not match the `int:<scheme>:<value>` grammar (§2.2)
 * - `unknown-scheme` — well-formed, but the scheme is not registered (§9.1)
 * - `noncanonical` — registered scheme, but the value is not in canonical form (§2.5)
 */
export type IidInvalidReason = 'malformed' | 'unknown-scheme' | 'noncanonical';

/** Why a valid IID may still not mint as a bare P0 anchor (spec §7.2). */
export type AnchorIneligibilityReason = 'class-c' | 'polymorphic-scheme';

export type IidInspection =
	| {
			readonly valid: true;
			readonly iid: IntuitionId;
			readonly scheme: SchemeName;
			readonly value: string;
			readonly class: IdentityClass;
			readonly typing: SchemeTyping;
			readonly anchorEligible: boolean;
			readonly anchorIneligibilityReason?: AnchorIneligibilityReason;
	  }
	| {
			readonly valid: false;
			readonly reason: IidInvalidReason;
			/** Present for `noncanonical` (and `unknown-scheme` shape splits). */
			readonly scheme?: string;
			readonly value?: string;
			/** The canonical repair when one exists (noncanonical inputs only). */
			readonly canonical?: IntuitionId;
	  };
