# @0xintuition/primitives

High-level atom, claim, predicate, classification, and validation helpers for building with Intuition off-chain data.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/primitives@alpha
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Usage

```ts
import { buildEthereumAccount } from '@0xintuition/primitives/atom'
import { buildTripleByName } from '@0xintuition/primitives/triple'

const account = buildEthereumAccount({
  address: '0x0000000000000000000000000000000000000001',
})
if (!account.success) throw new Error(account.errors.join(', '))

const claim = buildTripleByName(account.value.id, 'follow', account.value.id)
if (!claim.success) throw new Error(claim.errors.join(', '))
```

## IID atom anchors

`buildIidAnchor` is the supported high-level path from a classification's field values to canonical, identifier-first atom bytes ([IID spec](https://www.npmjs.com/package/@0xintuition/iid-spec)). It interprets the classification's identity ladder, selects the strongest legal representation profile, serializes deterministic bytes, computes the atom ID, and returns classification/provider hints plus an ordered URI context manifest.

```ts
import { buildIidAnchor } from '@0xintuition/primitives/anchor'

const anchor = buildIidAnchor(
  'music-recording',
  { isrc: 'US-RC1-76-07839' },
  { contextUris: ['https://app.example.com/track/1'] },
)
if (!anchor.success) throw new Error(anchor.errors.join(', '))

anchor.value.iid        // 'int:isrc:USRC17607839' — canonicalized
anchor.value.profile    // 'p0' — bare anchor: atomId is a pure function of the IID
anchor.value.data       // 'int:isrc:USRC17607839' (exact atom bytes)
anchor.value.id         // deterministic atom ID
anchor.value.contextUris  // ordered, deduplicated; NEVER affects the atom ID
anchor.value.providerPlan // ['musicbrainz', 'spotify', 'apple-music']
```

Rules the builder enforces: Class C (`gen1`) and polymorphic-scheme identifiers floor at P1 (their `@type` and recipe fields travel in the payload — requesting `p0` is a structured error, never a silent downgrade); URI context is validated against policy limits offline (pass live `getAtomUriConfig` values via `uriLimits`); equivalent reordered input produces identical bytes. The builder never calls wallets, contracts, or enrichment providers.

### Normative envelope bytes

Derive the IID using the classification's declared identity ladder, strongest rung first. A valid, anchor-eligible IID defaults to `p0`: the data is exactly the canonical IID string, with no JSON quoting. Weak `acct` handles (`int:acct:<platform>:@<handle>`) always floor at `p1`, even when the IID inspector reports eligibility. Class C and polymorphic identifiers also floor at `p1`. An explicit `p0` request for any of these, or without a usable IID, returns a structured error. An explicit `p1` or `p2` request with an IID uses the same envelope bytes; profile metadata is not serialized.

For an identity envelope, insert keys in exactly this order:

1. `@context`: the classification's `schema.context`, unchanged, including its trailing slash if present. Do not substitute a default context.
2. `@type`: the classification's declared type.
3. `identifier`: the derived canonical IID.
4. For a `gen1` IID, only the producing rung's recipe fields. If every source is `field`, sort the recipe by key using JavaScript string order; this preserves the train's existing direct-field envelopes. If any source is transformed, keep the entire recipe in declaration order. The six existing conformance differences in direct-field order remain assigned to reference adoption.
5. `sameAs`, only when its normalized array is nonempty. A non-array contributes nothing. For an array, retain only strings, remove exact duplicates, and sort with JavaScript's default `Array.sort()` (UTF-16 code-unit order). Preserve every retained string verbatim: no trimming, URL canonicalization, case folding, or Unicode normalization; empty strings are retained on this identity path.

Materialize each recipe value as a string from the declared source, independently of the normalized IID preimage. A direct string remains verbatim, including whitespace and punctuation; a finite numeric scalar uses `String(value)`. A `year` source emits the four-digit year from the trimmed source date under the recipe key, rather than the full date. A `text-hash` source emits `keccak16(norm1(text))`, 32 lowercase hex digits without `0x`, under the recipe key. A `geohash` source converts latitude and longitude to numbers and encodes the declared precision (currently seven characters for `geo7`), bisecting longitude first, alternating axes, using the upper interval on ties and the alphabet `0123456789bcdefghjkmnpqrstuvwxyz`. All recipe sources have already resolved successfully when their rung fires. Scheme rungs add no recipe fields. Descriptive and undeclared fields are omitted from identity envelopes; classification field validation does not run on this path.

Build a fallback envelope when no rung fires, the classification has no ladder, or the derived IID is `int:url:` followed by a canonical URL longer than the 220-character IID value cap. A URL exactly at the cap remains an identified envelope. Every other invalid derived IID returns an inspection error. On the fallback path, validate the complete value map through the classification package: unknown keys, missing required fields, and invalid field values are errors. Build the classification's atom-data object without identifier injection: `@context`, `@type`, then each declared field whose value is not `undefined`, in declaration order. Preserve scalar values and their types. Deduplicate and default-sort every declared `string[]` field, preserving its accepted strings, including non-URL strings. Empty arrays remain present. Input object order never controls output order.

Fallback metadata is `profile: 'p1'`, `iid: null`, `scheme: null`, `class: null`, no `tag`, and an empty provider plan. Consumers must handle nullable identity metadata. The builder's three parameters and their order are unchanged. URI context validation and ordering apply to fallback anchors too and never affect envelope bytes.

Serialize envelopes with compact `JSON.stringify`: insertion-ordered keys, no added whitespace or newline, and JavaScript JSON escaping. Encode the resulting string as UTF-8; `dataHex` is `0x` followed by lowercase byte hex. Compute `id = keccak256(ATOM_SALT || keccak256(utf8(data)))`, with `ATOM_SALT = 0xc50959b2b0264fed58f3489f13cdf8345df0911245cc2b741070787ee7aceaa2`, through `calculateAtomId`. Thus field order and string forms are part of the atom's identity.

Legacy JSON-LD builders (`buildAtom`, `buildPerson`, …) are unchanged and remain the explicit compatibility path for descriptive atom data. `recognizeAtomData` distinguishes canonical IID anchors from JSON payloads without reclassifying arbitrary strings.
