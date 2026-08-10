# Acceptance matrix and golden fixtures

## Shared fixture contract

Fixtures are versioned public data. Each record should carry:

- fixture ID and spec version;
- raw input and expected canonical IID or typed failure;
- profile/classification input where applicable;
- expected classification decision and provider plan;
- expected serialized atom string and UTF-8 hex;
- expected `calculateAtomId` result;
- ordered context strings and encoded bytes;
- expected protocol arguments/events;
- notes explaining identity-sensitive intent.

No expected deterministic value is recomputed by the same function under test and then treated as an independent oracle. Golden bytes and hashes must be reviewed from an authoritative fixture generator/reference.

## Minimum fixture set

| Fixture | Purpose | Expected result |
| --- | --- | --- |
| P0 ISRC | primary vertical slice | canonical, anchor eligible, `music-recording`, music providers |
| formatted ISRC | canonicalization | normalizes to same IID but raw form is not a valid new anchor |
| P0 ISBN | check-digit scheme | ISBN-10 input canonicalizes to ISBN-13; classifies book |
| colon-bearing CAIP-10 | parser boundary | value survives first-two-colon split |
| CAIP-19 ERC-20 | value-aware class | `ethereum-erc20` and chain providers |
| CAIP-19 unsupported subtype | no false class | valid identity, no ERC-20 classification |
| MBID recording/release/label/work | value-aware class | recording/album/company/unmapped as ratified |
| OLID author/work/edition | suffix typing | person/book/book |
| Wikidata Q42 | polymorphic | valid IID, no inferred classification, Wikidata provider |
| ISWC | explicit unmapped | valid/unambiguous scheme but no current classification |
| gen1 person | derived identity | deterministic P1/P2, never bare P0 |
| canonical URL | query/order normalization | deterministic Class B IID, polymorphic profile |
| malformed `int:src:*` | user-example guard | rejected as unknown scheme |
| noncanonical historical IID | read compatibility | resolvable cluster hint, not valid new anchor |
| legacy MusicRecording JSON-LD | backward compatibility | not parsed as IID; existing builder output unchanged |
| empty URI context | additive contract path | valid aligned input; no false context association |
| two URI context entries | ordering | event preserves byte order; atom ID unchanged |
| duplicate URI context | builder policy | exact duplicates removed from normalized manifest |
| opaque/non-UTF-8 URI bytes | protocol correctness | decoder preserves bytes; semantic builder rejects strings it cannot encode safely |
| URI count/length boundary | config validation | max accepted, max+1 rejected before wallet call |
| misaligned batch arrays | contract/API safety | structured failure before submission/simulation revert |

## Package test responsibilities

| Package | Required assertions |
| --- | --- |
| `iid-spec` | documents/JSON schema valid; every scheme has cases; fixture IDs unique |
| `iid` | parse, canonicalize, validate, format, derive, profile eligibility, runtime parity |
| `classifications` | ladder type compatibility, generation, source provenance, legacy output stability |
| `iid-registry` | totality, inverse coherence, value typing, provider ordering/narrowing, hints |
| `ids` | atom hash parity for IID/profile/legacy bytes; no behavior change expected |
| `primitives` | strongest rung, profile selection, exact bytes/hash, URI manifest, structured errors |
| `protocol` | ABI parity, calldata, simulation request, config reads, event decoding, existing API compatibility |
| `react` | preflight, wallet arguments, receipt association, states/callbacks, old hook compatibility |
| repository smoke | public exports only, packed exact pins, Node+Bun execution, no source leakage |

## Protocol URI cases

Direct creation tests cover:

- single atom and batch;
- explicit creator equal to caller;
- approved creator different from caller;
- zero creator rejection in SDK validation;
- assets/value equality;
- atom data/assets/URI outer-array equality;
- zero, one, and maximum URI count;
- maximum and over-maximum byte length;
- duplicate atom revert/existence precheck guidance;
- `AtomCreated` and `AtomContextRegistered` association by `termId` despite intervening logs;
- `AtomUriConfigUpdated` parsing;
- effective config tuple resolution;
- old `createAtoms` encoder/write behavior unchanged.

If FeeProxy is included, add affiliate registration/pause, fee cap/guard, forwarded assets, refunds, CREATION approval, and end-user registrant cases.

## Identity-sensitive review gate

Any PR changing one of the following gets an `identity-impact` review and explicit fixture diff:

- scheme spelling, grammar, validation, or canonicalization;
- NORM-1/gen1 algorithms or recipe tags;
- classification ladder order or source fields;
- profile selection or serialization;
- atom data bytes or ID calculation;
- predicate atom bytes used by existing primitive builders.

The PR body must state one of:

- `Identity impact: none — existing golden bytes unchanged`, or
- `Identity impact: intentional — fixture IDs X/Y change; migration decision D... approved`.

## Cross-repository consumer gate

Before P12, produce evidence from clean temporary consumers:

### Intuition Core

- installs packed versions without `file:`/Git dependencies;
- parses the P0 ISRC and colon-bearing fixtures;
- consumes registry results with no local scheme map;
- hashes IID bytes identically;
- recognizes the protocol ABI/event signature needed by its indexer.

### Private application monorepo

- replaces private IID package resolution with packed public exports;
- passes its IID/registry golden tests;
- reports any adapter-only differences without changing public semantics;
- builds an atom anchor matching the public primitive result.

Consumer success does not allow private types to leak back into the public API. Adapt private application code at its boundary.

## Evidence attached to final release PR

- full CI URLs and commit SHA;
- list of child PRs and approvals;
- package graph with versions and exact pins;
- fixture/conformance version and checksum;
- contract artifact version, integrity, and ABI fingerprint;
- tarball names, integrity/shasum, file lists, and sizes;
- Node and Bun clean-consumer output;
- Core and private consumer compatibility reports;
- NPM name/permission preflight;
- dist-tag plan;
- rollback/deprecation commands.
