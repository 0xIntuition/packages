export type MarketPattern = 'depositional' | 'attributive' | 'comparative';
export type PredicateStorageStrategy = 'inline' | 'ipfs';
export type PredicateForm = 'base' | 'thirdPerson' | 'pastParticiple' | 'displayName';
export type TextDirection = 'ltr' | 'rtl';

/**
 * Machine-readable relationship semantics added per `.planning/predicate-spec-decisions.md`.
 * All optional and additive — a predicate omitting them behaves exactly as before.
 */

/** What the object of an edge is, so a consumer can render/traverse it without per-predicate code. */
export type PredicateObjectKind = 'entity' | 'claim' | 'literal';
/** Refines `objectKind: 'literal'` into a concrete datatype (RDF/XSD-aligned). Only meaningful when objectKind === 'literal'. */
export type PredicateLiteralType = 'url' | 'image' | 'date' | 'number' | 'text';
/** Sign of the edge from subject toward object; signed aggregation accrues to the object. */
export type PredicatePolarity = 'positive' | 'negative' | 'neutral';
/** Freshness/lifecycle model — which edges silently decay, which are write-once. */
export type PredicateTemporalNature = 'permanent' | 'state' | 'event';
/** Fact vs. opinion, for market design and UI semantics. */
export type PredicateClaimType = 'factual' | 'evaluative';
/**
 * A reference to another predicate by its `key`. Existence and cross-referential consistency
 * (inverse mirroring, contradicts symmetry, specializes acyclicity) are validated over the full
 * set in `validate.ts`; the raw type is `string` to avoid a circular dependency on the derived
 * `PredicateKey` union (which is computed from the spec array).
 */
export type PredicateKeyRef = string;

export type PredicateCategory =
	| 'Identity/Classification'
	| 'Social/Reputation'
	| 'Curation/Containment'
	| 'Authorship/Contribution'
	| 'Metadata/Linking'
	| 'Affiliation/Membership'
	| 'Domain-Specific'
	| 'Sentiment/Opinion'
	| 'Comparison/Ranking'
	| 'Knowledge/Expertise'
	| 'Provenance/Evidence'
	| 'Temporal/Lifecycle'
	| 'Governance/Policy'
	| 'Economic/Market';

export interface PredicateDefinition {
	name: string;
	description: string;
	marketPattern: MarketPattern;
	conjugates: boolean;
	thirdPerson?: string;
	category: PredicateCategory;
	examples?: readonly string[];
	isTransitive: boolean;
	isSymmetric: boolean;
	isHierarchical: boolean;
	inversePredicate?: string;
	// machine-readable semantics (see PredicateSpec)
	objectKind?: PredicateObjectKind;
	literalType?: PredicateLiteralType;
	polarity?: PredicatePolarity;
	temporalNature?: PredicateTemporalNature;
	claimType?: PredicateClaimType;
	inverse?: PredicateKeyRef;
	specializes?: readonly PredicateKeyRef[];
	contradicts?: readonly PredicateKeyRef[];
	supersededBy?: PredicateKeyRef;
}

export type PredicateStatus = 'enshrined' | 'proposed' | 'deprecated';

export interface PredicateSpec {
	key: string;
	name: string;
	description: string;
	marketPattern: MarketPattern;
	conjugates: boolean;
	thirdPerson?: string;
	category: PredicateCategory;
	status: PredicateStatus;
	examples?: readonly string[];

	// algebraic (OWL-aligned, flat, is* convention)
	isTransitive?: boolean;
	isSymmetric?: boolean;
	/** @deprecated Legacy display-name of the inverse. Prefer the typed-key `inverse`; kept for back-compat. */
	isHierarchical?: boolean;
	/** @deprecated Display-name of the inverse predicate. Prefer the typed-key `inverse`; kept for back-compat. */
	inversePredicate?: string;

	// rendering contract (frontend reads these directly)
	objectKind?: PredicateObjectKind;
	/** Only meaningful when `objectKind === 'literal'` (validated). */
	literalType?: PredicateLiteralType;
	polarity?: PredicatePolarity;
	temporalNature?: PredicateTemporalNature;
	claimType?: PredicateClaimType;

	// inter-predicate (typed key references — validated over the full set in validate.ts)
	/** The reverse-direction predicate's `key` (different predicate). Omit for symmetric predicates (inverse = self). */
	inverse?: PredicateKeyRef;
	/** Parent predicate `key`(s) this one is a sub-property of. A DAG: usually one, occasionally two. */
	specializes?: readonly PredicateKeyRef[];
	/** Predicate `key`(s) that are pair-level disjoint with this one (declared symmetrically). */
	contradicts?: readonly PredicateKeyRef[];
	/** Successor predicate `key`; only valid when `status === 'deprecated'`. */
	supersededBy?: PredicateKeyRef;
}

export type PredicateRecord<TSpec extends PredicateSpec = PredicateSpec> = PredicateDefinition & {
	key: TSpec['key'];
	status: TSpec['status'];
};

export interface PredicateAtomDocument {
	'@context': 'https://schema.org/';
	'@type': 'DefinedTerm';
	name: string;
	description: string;
}

export interface PredicateLocaleForms {
	base: string;
	thirdPerson?: string;
	pastParticiple?: string;
}

export interface PredicateLocaleBundle {
	predicateAtomId?: string;
	canonicalName?: string;
	locale?: string;
	version?: number;
	displayName?: string;
	forms?: PredicateLocaleForms;
	templates?: Record<string, string>;
	meta?: {
		conjugates?: boolean;
		direction?: TextDirection;
	};
}

export interface PredicateLocaleLabels extends PredicateLocaleForms {
	displayName: string;
	direction?: TextDirection;
}

export interface PredicateIpfsOptions {
	description: string;
	sameAs?: readonly string[];
	marketPattern: MarketPattern;
	conjugates: boolean;
	i18n: Record<string, PredicateLocaleLabels>;
	inDefinedTermSet?: string;
	isTransitive?: boolean;
	isSymmetric?: boolean;
	isHierarchical?: boolean;
	inversePredicate?: string;
	objectKind?: PredicateObjectKind;
	literalType?: PredicateLiteralType;
	polarity?: PredicatePolarity;
	temporalNature?: PredicateTemporalNature;
	claimType?: PredicateClaimType;
	inverse?: PredicateKeyRef;
	specializes?: readonly PredicateKeyRef[];
	contradicts?: readonly PredicateKeyRef[];
	supersededBy?: PredicateKeyRef;
}

export type PredicateIpfsPropertyName =
	| 'marketPattern'
	| 'conjugates'
	| 'i18n'
	| 'isTransitive'
	| 'isSymmetric'
	| 'isHierarchical'
	| 'inversePredicate'
	| 'objectKind'
	| 'literalType'
	| 'polarity'
	| 'temporalNature'
	| 'claimType'
	| 'inverse'
	| 'specializes'
	| 'contradicts'
	| 'supersededBy';

export interface PredicateIpfsDocument extends PredicateAtomDocument {
	inDefinedTermSet: string;
	sameAs?: readonly string[];
	alternateName?: Array<{
		'@language': string;
		'@value': string;
	}>;
	additionalProperty: Array<{
		'@type': 'PropertyValue';
		name: PredicateIpfsPropertyName;
		value: unknown;
	}>;
}

export type ParsedPredicateAtomData =
	| {
			kind: 'inline';
			value: PredicateAtomDocument;
	  }
	| {
			kind: 'ipfs';
			value: `ipfs://${string}`;
	  };
