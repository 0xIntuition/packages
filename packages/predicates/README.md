# @0xintuition/predicates

Canonical Intuition predicate registry, launch constants, entity mappings, and display helpers.

Alpha status: published under the alpha dist-tag. Predicate standalone modules are generated from per-predicate source specs.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Included

- Generated predicate registry with deterministic inline `DefinedTerm` atom data and atom IDs
- Semantic metadata on every record: `isTransitive`, `isSymmetric`, `isHierarchical`, and optional `inversePredicate`
- Launch-set constants, bootstrap helpers, and market-pattern marker atoms
- Strategy helpers for canonical inline atom data and optional IPFS enrichment documents (IPFS documents carry the semantic flags in `additionalProperty`; inline atom data stays minimal for identity stability)
- Legacy entity-type recommendations plus subject-aware display and localization primitives

## Relationship Modeling

`@0xintuition/predicates` owns reusable predicate vocabulary: keys, names, descriptions, deterministic IDs, launch constants, and display helpers.

The legacy entity-type map remains exported for compatibility and broad discovery, but its `expectedObjectType` values are human-readable hints. New classification-specific creation UI should use `@0xintuition/classifications` metadata predicate matrix instead, where object targets are typed as classification, schema, primitive, same-classification, or any.

## Example

```ts
import {
	buildPredicateIpfsDocument,
	createPredicateAtomData,
	getLaunchPredicateBootstrapTriples,
	PREDICATE_IDS,
} from '@0xintuition/predicates'
import {
	follow,
	followSpec,
	followAtomData as standaloneFollowAtomData,
	followId as standaloneFollowId,
} from '@0xintuition/predicates/follow'

const followAtomData = createPredicateAtomData(
	'follow',
	'Directional subscription or tracking of the object entity'
)

const registryFollowId = PREDICATE_IDS.follow
const followName = follow.name
const followKey = followSpec.key
const standaloneFollow = { id: standaloneFollowId, atomData: standaloneFollowAtomData }

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

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.
