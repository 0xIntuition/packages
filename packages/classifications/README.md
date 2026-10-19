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

## Consumer Helpers

`getClassificationByType('MusicRecording')` looks up the canonical schema type
exactly and returns the same frozen spec as `getClassification('music-recording')`.
Unknown types return `undefined`.

`getClassificationByReference('song')` resolves trimmed, case-insensitive
references in this order: canonical slug, schema type, unique common name,
unique display name, then unique engine category. Ambiguous tiers fall through;
unresolved references return `undefined`. `buildClassificationReferenceResolver`
applies the same rules to a supplied spec list, independently of its order.

`getClassificationLabel(spec)` returns the optional `commonName` or falls back
to `displayName`: MusicRecording renders as “Song” and MusicGroup as
“Artist/Band”. Canonical names stay stable. Optional `atomCategory` carries the
engine token (for example, `song`); `category` keeps the catalogue grouping.

```ts
import {
  buildAtomDataObject,
  buildClassificationSearchText,
  deriveClassificationIdentifier,
  getClassificationByType,
} from '@0xintuition/classifications'

const book = getClassificationByType('Book')!
const values = { name: 'The Sovereign Individual', isbn: '9780684832722' }
const identifier = deriveClassificationIdentifier(book.slug, values)
// { iid: 'int:isbn:9780684832722', scheme: 'isbn', class: 'A' }

const data = buildAtomDataObject(book.slug, values, { identifier: true })
const searchText = buildClassificationSearchText(book.fields, values, values.name)
```

Identifier derivation projects the declarative `identity.ladder` through the IID
engine. Unknown slugs throw; a missing identity or an unfired ladder returns
`undefined`. Podcast feed GUIDs normalize scheme and host case while preserving
path and query bytes. Atom data includes the derived `identifier` immediately
after `@type` only when opted in, for both object and serialized builders.
Callers that pass `identityLadderFor(...)` directly to the IID engine must
normalize podcast feed URLs themselves; the normalization above belongs to
`deriveClassificationIdentifier`.

Search text includes the primary text, declared string fields, and corpus names
from `description`, `author`, and `about`. It removes duplicates and URL/IID-like
strings. The base remains unbounded; `CLASSIFICATION_SEARCH_TEXT_MAX_LENGTH`
exports the 20,000-character cap for downstream composition.

## Discovery and Visibility Data

`DISCOVER_ACTIVITY_GROUPS` defines the shared `read`, `watch`, and `listen`
classification memberships. `PRIMARY_ITEM_CATALOGUE_PRESET` lists machinery
types hidden from item browsing, plus the self-created `EthereumAccount` rule.
`filterClassificationSpecsForPrimaryCatalogue(...)` narrows spec option lists;
`isClassificationTypeInPrimaryCatalogue(...)` tests a type. Neither removes
specs from the canonical catalogue.

`PRIMARY_ITEM_CATALOGUE_VISIBILITY`, `ALL_ATOMS_VISIBILITY`, and
`ATOM_VISIBILITY_MODES` identify the supported modes. Use
`resolveAtomVisibilityFilters({ visibility, excludeClassifications })` to expand
a mode into exclusion lists; `all` keeps only caller exclusions.

`NATIVE_ATOM_CLASSIFICATION_TYPES` and `isNativeAtomClassificationType(...)`
describe authoritative native writer types independently of visibility.
`nativeAtomClassificationTypeForData(...)` recognizes UUID-backed native content
URNs and returns `null` for other data. `IDENTITY_FIELD_SCHEMA_ORG_ALIASES`
provides the identity field mapping from `isrc` to `isrcCode`.

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

Ethereum classifications declare `https://schemas.intuition.systems/v1`.
SocialMediaAccount declares `https://schema.org/` for reference byte parity,
although that type is absent from the pinned schema.org vocabulary. No spec
currently references the separately hosted `schema.intuition.systems` contexts.
