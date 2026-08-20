/**
 * Coordination types bridging `@0xintuition/iid` (identifier grammar) and
 * `@0xintuition/classifications` (specs) to enrichment-provider selection.
 *
 * This package is the ONLY scheme-to-classification/provider bridge. It is
 * pure and offline: provider slugs are capability identifiers, never
 * imports of provider implementations.
 */
import type { ClassificationCategory } from '@0xintuition/classifications';

/** Read-side classification resolution for an IID. */
export interface IidClassification {
	/** Classification slug, e.g. `music-recording`. */
	readonly slug: string;
	/** `ClassificationSpec.type`, e.g. `MusicRecording`. */
	readonly schemaType: string;
	/** `ClassificationSpec.displayName`, e.g. `Music Recording`. */
	readonly displayName: string;
	/** `ClassificationSpec.category`, e.g. `Media`. */
	readonly category: ClassificationCategory;
}

/**
 * A scheme ratified `unambiguous` (`SCHEME_TYPING`): the scheme (or a type
 * segment inside the value) implies the entity's classification, so bare
 * P0 anchors are legal. The classification table (`classification-map.ts`)
 * must stay total over this union — a new unambiguous scheme in
 * `@0xintuition/iid` fails this package's totality test until mapped.
 */
export type UnambiguousScheme =
	| 'isbn'
	| 'isrc'
	| 'iswc'
	| 'lei'
	| 'gtin'
	| 'eidr'
	| 'mbid'
	| 'olid'
	| 'podcastguid'
	| 'caip19'
	| 'appid'
	| 'purl'
	| 'acct'
	| 'rssitem'
	| 'termset'
	| 'gen1';

/** Scheme alone decides the classification. */
export interface DirectClassificationEntry {
	readonly kind: 'direct';
	readonly slug: string;
}

/**
 * The classification is read from a type segment inside the canonical value
 * (`mbid:<entity-type>:…`, `olid:OL…[AMW]`, `gen1:<slug>:…`, CAIP asset
 * namespaces). Returns `undefined` for segments with no classification.
 */
export interface ValueTypedClassificationEntry {
	readonly kind: 'value-typed';
	readonly resolveSlug: (canonicalValue: string) => string | undefined;
}

/**
 * Ratified unambiguous, but no classification exists for the identified
 * entity kind yet (e.g. `iswc` — musical compositions). Distinct from
 * polymorphic `undefined` so intent is testable.
 */
export interface UnmappedClassificationEntry {
	readonly kind: 'unmapped';
	readonly reason: string;
}

export type ClassificationEntry =
	| DirectClassificationEntry
	| ValueTypedClassificationEntry
	| UnmappedClassificationEntry;
