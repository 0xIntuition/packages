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

## Root API

| Exports | Purpose |
| --- | --- |
| `getType`, `hasType`, `listTypes` | Look up, test, and enumerate pinned schema.org types |
| `getPropertiesFor` | Resolve properties including inherited definitions |
| `normalizeSchemaOrgName` | Normalize schema.org names and URIs |
| `SCHEMA_ORG_TYPES` | Generated type registry |
| `SCHEMA_ORG_CONTEXT`, `SCHEMA_ORG_VERSION` | Vocabulary context and pinned version |
| `SCHEMA_ORG_RELEASE_DATE`, `SCHEMA_ORG_SOURCE_URL` | Source provenance |
| `SCHEMA_ORG_GENERATED_TYPE_COUNT`, `SCHEMA_ORG_GENERATED_PROPERTY_COUNT` | Generated vocabulary counts |
| `SchemaOrgTypeSpec`, `SchemaOrgPropertySpec`, `ResolvedSchemaOrgPropertySpec` | TypeScript type and property records |

## Subpath contract

`@0xintuition/schema-org/<TypeName>` resolves a generated type module using the
exact, case-sensitive schema.org name, for example `@0xintuition/schema-org/Book`.
That module exports the named record `schemaOrgBook`. The wildcard supports
only type names present in this pinned vocabulary; an arbitrary name does not
resolve. `@0xintuition/schema-org/package.json` exposes package metadata.
