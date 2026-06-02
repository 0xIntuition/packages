export type MarketPattern = 'depositional' | 'attributive' | 'comparative';
export type PredicateStorageStrategy = 'inline' | 'ipfs';
export type PredicateForm = 'base' | 'thirdPerson' | 'pastParticiple' | 'displayName';
export type TextDirection = 'ltr' | 'rtl';

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
	relationships?: PredicateRelationshipMap;
}

export type PredicateStatus = 'enshrined' | 'proposed' | 'deprecated';
export type PredicateRelationshipDirection = 'out' | 'in';

export interface PredicateRelationshipSpec {
	direction: PredicateRelationshipDirection;
	expectedObjectTypes: readonly string[];
	schemaOrgProperty?: string;
}

export type PredicateRelationshipMap = Record<string, PredicateRelationshipSpec>;

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
	isTransitive?: boolean;
	isSymmetric?: boolean;
	isHierarchical?: boolean;
	inversePredicate?: string;
	relationships?: PredicateRelationshipMap;
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
}

export type PredicateIpfsPropertyName =
	| 'marketPattern'
	| 'conjugates'
	| 'i18n'
	| 'isTransitive'
	| 'isSymmetric'
	| 'isHierarchical'
	| 'inversePredicate';

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
