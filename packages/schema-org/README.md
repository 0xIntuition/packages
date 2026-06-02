# @0xintuition/schema-org

Pinned schema.org type and property vocabulary for Intuition alpha packages.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Included

- schema.org V30.0 vocabulary generated from `https://schema.org/version/30.0/schemaorg-current-https.jsonld`
- Generation reads the vendored V30.0 JSON-LD snapshot by default; maintainers can refresh the snapshot explicitly with `bun run schema-org:refresh`
- One typed source module per `schema:` class
- Normalized type records with directly declared properties and resolved `subClassOf` chains
- Runtime accessors that resolve inherited properties and tag each property with its originating type

## Install

```bash
bun add @0xintuition/schema-org@alpha
```

## Usage

```ts
import { getPropertiesFor, getType } from '@0xintuition/schema-org'
import { schemaOrgBook } from '@0xintuition/schema-org/Book'

const book = getType('Book')
const bookProperties = getPropertiesFor('Book')
const title = bookProperties.find((property) => property.name === 'name')

console.log(book?.subClassOf)
console.log(schemaOrgBook.name)
console.log(title?.originType)
```

Generated artifacts are intentionally normalized: a type file stores only that type's directly declared properties plus its `subClassOf` chain. `getPropertiesFor` derives inherited properties at runtime.

Types whose schema.org names are not safe exact JavaScript exports, such as `3DModel`, `Number`, `Date`, or `Map`, are still available from their subpath module via the `schemaOrg<Name>` named export or default export.
