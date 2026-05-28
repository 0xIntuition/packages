# @0xintuition/predicates

Canonical Intuition predicate registry, launch constants, entity mappings, and display helpers.

Alpha status: publish under the alpha dist-tag after review. This package reflects PR #453 predicate catalog cleanup and keeps predicate splitting deferred as generator/design work.

## Included

- 97-predicate registry with deterministic inline `DefinedTerm` atom data and atom IDs
- Semantic metadata on every record: `isTransitive`, `isSymmetric`, `isHierarchical`, and optional `inversePredicate`
- Launch-set constants, bootstrap helpers, and market-pattern marker atoms
- Strategy helpers for canonical inline atom data and optional IPFS enrichment documents (IPFS documents carry the semantic flags in `additionalProperty`; inline atom data stays minimal for identity stability)
- Entity-type recommendations plus subject-aware display and localization primitives

## Example

```ts
import {
	buildPredicateIpfsDocument,
	createPredicateAtomData,
	getLaunchPredicateBootstrapTriples,
	PREDICATE_IDS,
} from '@0xintuition/predicates'

const followAtomData = createPredicateAtomData(
	'follow',
	'Directional subscription or tracking of the object entity'
)

const followId = PREDICATE_IDS.follow

const containIpfsDoc = buildPredicateIpfsDocument('contain', {
	description: 'The subject collection or container includes the object as a member or entry',
	marketPattern: 'attributive',
	conjugates: true,
	i18n: {
		en: { base: 'contain', thirdPerson: 'contains', displayName: 'Contain' },
	},
	isHierarchical: true,
	inversePredicate: 'listed in',
})

const bootstrapTriples = getLaunchPredicateBootstrapTriples()
```


## Install

```bash
bun add @0xintuition/predicates@alpha @0xintuition/ids@alpha viem
```

Peer dependency: `viem ^2.0.0`.

