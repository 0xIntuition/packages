# Conformance harness

Five offline proofs compare the built public package surfaces with reference implementation @ 31b62f3 (`31b62f35a787b6a7b9318f7a5d245ba6d0c76e9b`). Oracle JSON is checked in under `vectors/`; tests never load the generator inputs or reference modules.

```sh
bun run build
bun run conformance:check
bunx --no-install biome check conformance
```

Build first: resolution must reach each package's exported `dist` entrypoint. The root script is exactly `bun test conformance`. Bun treats that argument as a path filter and additionally runs the existing package file named `conformance.test.ts` (169 tests); those incidental tests are reported separately from the five proofs below. For just the root harness and its integrity self-tests, `bun test ./conformance` is an optional focused command.

The runner prints agreement, known-divergence, unexpected-failure, and OPEN counts for each proof. It exits nonzero for any unexpected difference, agreement on a listed divergence, or fingerprint drift. An OPEN test uses `test.todo` with the concrete missing capability in its name. Typed-wd vectors are excluded explicitly and enumerated in the report; they enter with the typed-wd stack.

| Proof | Establishes | Limits |
| --- | --- | --- |
| Parse/classify | The nine selected parser-contract cases and golden ISRC cover outcome class, canonical IID, and rejection reason; the golden IID also covers registry type/slug/category, identifier hints, providers, class, and typing. | Parser-contract cases contain no classification expectations. Remote-resolution policy is not modelled by the public packages. |
| Anchor/build/hash | Supported non-typed inputs, including candidate overrides, compare the complete serialized string, UTF-8 hex, length, key order, profile, IID, and salted atom ID; the builder's own data/string/hex/id invariant is checked. Direct public validators compare return values and typed rejection details. | Search text and the complete fallback error surface are outside the builder comparison. Six existing recipe-order differences remain exact, self-retiring divergence entries. |
| Encode/decode | Every registered successful train anchor is encoded with its IID as the sole URI, decoded against the exported ABI, hashed, and linked across synthetic AtomCreated/AtomContextRegistered logs using the public event parsers. | Synthetic receipts prove local ABI/event handling; no transaction is submitted. The odd-length hex probe asserts that both validation and encoding reject malformed bytes. |
| Ladder differential | All retained value maps use `deriveIntuitionId` with the classification's inline declarative ladder; compare IID, winning rung, full derivation, canonical validation, and anchor eligibility. Compare all 37 ladder structures, including aggregate-rating's null ladder. | The strong-identifier projection is a different evaluator and is not substituted. The reference classification wrapper is unavailable publicly; its three invalid derivations are checked as derived strings followed by validation false. |
| Canonicalization | All 131 vectors compare the train and the recorded reference separately with corpus expectations using SCHEMES canonicalize, parse, norm1, and buildGen1Iid. Every recorded agrees flag is recomputed and the false-id set must equal disagreements. gen1 preimages are reconstructed and hashed through public norm1/keccak16. | No preimage export is assumed; no typed-wd canonicalizer is tested at this base. |

No proof covers a database-backed runner, devnet, publication, live registry, provider calls, live configuration, or deployed behavior. The golden runner's database header is transcribed evidence only.

## Findings carried as entries

- Six existing direct-field recipe-order differences remain in the anchor proof.
- The parser, ladder, and canonicalization entries retain their existing fingerprints.
- Candidate anchors and direct validators add no divergences.

The required command reports **1091 pass, 0 todo, 0 fail** across 7 files (1091 tests), including 23 integrity self-tests and 210 package conformance tests. The registered five-proof inventory accounts for 849 agreements and 9 known divergences (anchor proof: 75 agreements, 6 divergences, 0 OPEN). The 23 formerly OPEN cases (14 candidate anchors and 9 validators) now run as ordinary comparisons. Encode registration remains unchanged: candidate anchors are outside its pinned inventory, and it registers identified anchors only: a no-identifier fallback envelope has no URI to encode, so those builds stay outside the encode inventory pinned in the manifest. The table below is regenerated with enumerationTable() and is checked by the integrity self-test.

## Runtime enumeration

The manifest pins sorted ids and counts for every vector file, every canonicalization subcorpus, direct validators, ladder structures, and the five registered proof sets. Each file's afterAll check asserts that executed cases and divergence counts match its inventory. The integrity self-test checks this README table against the same registrations; a truncated corpus fails before any proof can run.

| Proof file | Registered | Executed | Agreements | Divergences | OPEN |
| --- | ---: | ---: | ---: | ---: | ---: |
| parse-and-classify.test.ts | 10 | 10 | 9 | 1 | 0 |
| anchor-build-hash.test.ts | 81 | 81 | 75 | 6 | 0 |
| encode-decode.test.ts | 51 | 51 | 51 | 0 | 0 |
| ladder-differential.test.ts | 454 | 454 | 454 | 0 | 0 |
| canonicalization-parity.test.ts | 262 | 262 | 260 | 2 | 0 |

## Parser result shapes

The public parseIntuitionId contract returns undefined for rejection: there is no rejection object and no scheme/value field. Success is exactly an object with own string fields scheme and value; scheme must be registered and value nonempty. The adapter validates that shape before projecting fields. Only the documented rejection sentinel becomes the corpus's explicit {scheme: null, value: null}. Empty objects, null, missing fields, undefined-valued fields, and mixed null/string fields fail. Public scheme canonicalizers also document undefined for rejection; their adapter maps that sentinel once to canonical: null.

Comparisons use strict structural equality. Shared normalization sorts object keys and converts bigint to decimal strings; it never converts undefined to null. Proof comparison and fingerprinting reject unexpected undefined, so JSON serialization cannot hide it. Recorded reference fields are checked directly rather than filled in when absent.

## Typed-wd exclusions

34 anchor/ladder cases (7 anchors + 27 ladders) enter with the typed-wd stack. Additionally, 36 parser-corpus cases excluded from C1 at this base; enter with the typed-wd stack. Total typed-wd exclusions: 70. The complete parser corpus has 73 cases; parser-corpus-inventory.json preserves their names only, and the test derives and prints the count by filtering iid_typed_wd_ names. It executes none of their inputs or expectations. The selected C1 corpus remains exactly nine cases, including iid_legacy_bare_wd_parse_only. All exclusions and loaded inventories are pinned in manifest.json.

## Mappings

`support/public.ts` resolves packages by name via public exports, asserts built `dist` resolution, and imports that resolved entry. The isolated workspace install does not link these packages at the root. Root resolution is attempted first; otherwise package self-references resolve through their existing public manifests, and viem resolves from its existing protocol consumer. No source entrypoints, new dependencies, or new workspace links are introduced.

`support/mappings.ts` matches each reference slug to the unique train classification with the same schema type. All 37 slugs currently map identically. The public evaluator receives `{slug, identifies, rungs: spec.identity.ladder}`. Winning rungs compare kind, scheme, stable tag, input field keys, and ordered recipe fields. Numeric indices are local to each declaration: structural sequence comparison separately detects missing/reordered rungs. The Person OLID author rung and all 37 recorded ladder structures now agree with the reference.

Reference `buildAtomAnchor(slug, values, {candidateIid})` maps to public `buildIidAnchor(slug, values, options)` and its identical `buildAtomAnchor` alias. The local adapter in `support/proofs.ts` passes values and `candidateIid` unchanged; no override is manufactured by injecting fields. Public structured failures are normalized by meaning to INVALID_IID (failed identifier inspection or candidate validation) or Error. This comparison does not assert builder exception-type parity: public builders return `BuildResult`, while the reference throws. Permanent primitives tests pin candidate failure messages. Direct validator proofs call the public exports and compare their boolean results or exact thrown name, code, and message. All 14 registered candidate cases and 9 validator cases agree, with no OPEN cases remaining. Historical typed-wd exclusions and the encode inventory remain unchanged.

The golden reference's application category `song` corresponds to the public classification category `Media`; the harness asserts this explicit semantic mapping. It does not claim the public registry exports the reference's application category vocabulary. The golden classification's slug and schema type compare directly.

## Agreement matrix

| Corpus | Vectors | Train vs corpus: agree / diverge | Reference vs corpus: agree / diverge |
| --- | ---: | --- | --- |
| canonicalization | 101 | 101 / 0 | 101 / 0 |
| parse | 11 | 11 / 0 | 9 / 2 |
| norm1 | 13 | 13 / 0 | 13 / 0 |
| gen1 | 6 | 6 / 0 | 6 / 0 |
| Total | 131 | 131 / 0 | 129 / 2 |

All five wd canonicalization cases use bare QIDs and agree at this base. No wd case is hidden by an unconditional scheme exclusion. The two parse divergences are parse-009 (space) and parse-010 (non-ASCII); the reference parser must tighten to the corpus grammar. The separate uppercase parser-contract divergence also records the corpus's case-sensitive namespace rule. The reference keeps a lenient ingest parse on purpose: its consumers canonicalize raw values after parsing, and a tightening audit showed that a strict parser changes behaviour at several write and identity paths there, so these entries record a ruling rather than a defect on either side.

## Adding a vector

Copy a new oracle case into the appropriate checked-in vector file, preserving its provenance, raw input, and recorded output. The historical parser corpus intentionally contains only the nine selected cases, with a provenance note identifying its different origin. Generated vector files retain the original provenance headers. Existing adapters enumerate all cases dynamically against vectors/manifest.json; a missing, duplicate, or replaced id, changed count, unknown corpus type, public derivation source, or provenance SHA fails explicitly. Deliberate oracle additions require a reviewed manifest update (sorted ids and counts for the file, affected subcorpus, and registered proof inventory); never regenerate the manifest during a test to accommodate missing data. Add an adapter only using public exports. Run the harness before adding an entry to the divergence table, inspect the complete byte and identity difference, and keep the failing regression.

A package defect cannot be fixed here. Record its concrete input and output in the report and an explicit case entry with reason `defect, follow-up`. Keep unsupported capabilities OPEN with a specific reason. Never change an oracle expectation to make the train agree.

## Retiring a divergence

Each entry in `known-divergences.ts` carries a case id, which side changes, a one-sentence reason, and a removal condition. SHA-256 fingerprints pin the complete normalized observed and expected comparison outputs. For parse-009/010 the observed side is the reference parser, and the expected side is the corpus; for the protocol hex probe the expected side is the local validation invariant. Other entries compare the train with the recorded reference. Normalization sorts object keys but preserves strings and array order; serialized JSON and hex therefore remain byte-sensitive.

A listed test must still disagree and must still match both fingerprints. Agreement or any unexpected drift fails; orphaned, duplicate, and OPEN entries are rejected. After the specified fix/regeneration, remove the entry and let the ordinary equality test pass. For the odd-hex entry, replace the divergence with an explicit validator-rejection assertion when that follow-up lands. Never refresh fingerprints merely to silence a changed output.

## Integration reconciliation — 2026-10-19

After combining #24–#34, eleven ISNI ladder cases now match the unchanged reference outputs exactly because #28 accepts ISNI URLs. Their divergence entries are retired; their tests remain ordinary equality checks. #33 fixes odd-length atom bytes, so `protocol-odd-length-hex` now requires both the validator and encoder to reject `0xabc` with the even-length-hex diagnostic. The reference oracle files and proof inventories are unchanged.

The person ISNI anchor case, which #28 fixed only for the identifier (`int:isni:0000000121032683`) while the public P1 builder still omitted `sameAs`, now agrees in full: the builder keeps `sameAs` as the last identity field, the 144-byte envelope and its atom id `0xb763b2a00d5dad1b6c3ccd18cdb5009d7e4954c8eec50974999151be6da250fa` equal the unchanged reference, and its divergence entry is retired.

The classifications parity port reconciles 26 ladder comparisons: six Book dormant written-work cases, eight Company dormant organization cases, six MusicAlbum dormant album cases, five Person OLID author cases, and the Person ladder structure. Each public output exactly matches the unchanged oracle; their divergence entries are retired and their permanent tests enforce ordinary equality. The coordinator's podcast normalization fix also retired one ladder divergence and one anchor divergence before this reconciliation. The declarative engine now also skips Wikidata rungs without an active slug, as the reference does, so the 39 ladder divergences across brand, event, local-business, location, music-group, and thing agree with the unchanged oracle and are retired; each derivation was reproduced offline against the reference sources and no expected fingerprints or oracle vectors changed. The combined weak-account and anchor parity changes leave 9 known divergences with their recorded fingerprints. The 70 historical typed-wd exclusions also remain outstanding, including 36 parser cases for which the checked-in oracle contains names only. Typed-wd package unit tests pass separately, but completing these cross-package proofs and reconciling classifications remains a release gate. A passing harness establishes its recorded agreements and known differences, not full parity with the internal application.
