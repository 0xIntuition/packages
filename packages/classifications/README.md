# @0xintuition/classifications

Canonical classification specs, Creation Profiles, and JSON-LD atom data builders for Intuition alpha packages.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/classifications@alpha
```

## Usage

```ts
import { buildAtomData, getClassification } from '@0xintuition/classifications'

const spec = getClassification('ethereum-account')
const atomData = buildAtomData('ethereum-account', {
  address: '0x0000000000000000000000000000000000000001',
})
```

Each classification separates recommended atom fields from recommended triple
metadata:

```ts
const book = getClassification('book')

book?.schema
// { context: 'https://schema.org/', type: 'Book' }

book?.fields.map((field) => field.schemaProperty)
// ['name', 'author', 'isbn', 'sameAs']

book?.metadataPredicates
// ['authoredBy', 'publisher', 'hasCategory', ...]
```

`schema` is a generic schema pointer. Today most public classifications point at
schema.org, but the field is intentionally not named `schemaOrg` so other schema
sources can be supported later. For schema.org-backed classifications,
`schemaProperty` points at the canonical schema.org property name. It does not
copy inheritance or provenance into the classification; consumers can derive that
from `@0xintuition/schema-org`.

## Browser Creation UIs

Use Creation Profiles for known frontend create flows. They are generated plain
data artifacts that compose the classification fields, schema property
provenance, metadata predicate matrix rows, and predicate IDs/labels without
importing the full schema.org registry at runtime:

```ts
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording'

musicRecordingCreationProfile.fields.map((field) => field.schema?.originType)
// ['Thing', 'MusicRecording', 'MusicRecording', 'Thing']

musicRecordingCreationProfile.relationships.map(({ predicate }) => predicate.label)
// ['by artist', 'in album', 'in playlist', 'has category', 'same as']
```

Root registry helpers such as `getClassification(...)`,
`getMetadataPredicateMatrixFor(...)`, and schema.org `getPropertiesFor(...)`
remain the dynamic server/admin/explorer/build-time APIs. Prefer Creation
Profiles in browser-hot paths when the create flow targets a known
classification.

The optional matrix layer adds object-target semantics for promoted metadata
predicates without putting classification-specific relationships into
`@0xintuition/predicates`:

```ts
import { getMetadataPredicateRelation } from '@0xintuition/classifications'

getMetadataPredicateRelation('music-recording', 'inPlaylist')
// {
//   expectedObjects: [
//     { kind: 'schema', context: 'https://schema.org/', type: 'MusicPlaylist' }
//   ],
//   schemaMappings: [
//     { context: 'https://schema.org/', property: 'inPlaylist', match: 'exact' }
//   ]
// }
```

Known classifications are also available as direct subpath imports:

```ts
import { ethereumAccount } from '@0xintuition/classifications/ethereum-account'
```

Ethereum and other Intuition-local classifications use immutable `https://schema.intuition.systems/v1/...` JSON-LD contexts and are gated on `schema.intuition.systems` resolving before publication.
