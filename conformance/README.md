# Conformance harness

Five offline proofs compare the built public package surfaces with reference implementation @ 31b62f3 (`31b62f35a787b6a7b9318f7a5d245ba6d0c76e9b`). Oracle JSON is checked in under `vectors/`; tests never load the generator inputs or reference modules.

```sh
bun run build
bun run conformance:check
bunx --no-install biome check conformance
```

Build first: resolution must reach each package's exported `dist` entrypoint. The root script is exactly `bun test conformance`. Bun treats that argument as a path filter and additionally runs the existing package file named `conformance.test.ts` (146 tests); those incidental tests are reported separately from the five proofs below. For just the five root files, `bun test ./conformance` is an optional focused command.

The runner prints agreement, known-divergence, unexpected-failure, and OPEN counts for each proof. It exits nonzero for any unexpected difference, agreement on a listed divergence, or fingerprint drift. An OPEN test uses `test.todo` with the concrete missing capability in its name. Typed-wd vectors are excluded explicitly and enumerated in the report; they enter with the typed-wd stack.

| Proof | Establishes | Limits |
| --- | --- | --- |
| Parse/classify | The nine selected parser-contract cases and golden ISRC cover outcome class, canonical IID, and rejection reason; the golden IID also covers registry type/slug/category, identifier hints, providers, class, and typing. | Parser-contract cases contain no classification expectations. Remote-resolution policy is not modelled by the public packages. |
| Anchor/build/hash | Supported non-typed inputs compare the complete serialized string, UTF-8 hex, length, key order, profile, IID, and salted atom ID; the builder's own data/string/hex/id invariant is checked. | Candidate overrides, direct reference validators, search text, and fallback field-validation semantics lack equivalent public APIs. Five single-field anchor findings are carried as exact, self-retiring divergence entries. |
| Encode/decode | Every supported successful train anchor is encoded with its IID as the sole URI, decoded against the exported ABI, hashed, and linked across synthetic AtomCreated/AtomContextRegistered logs using the public event parsers. | Synthetic receipts prove local ABI/event handling; no transaction is submitted. The odd-length hex probe explicitly records the current validation/padding/hash discrepancy. |
| Ladder differential | All retained value maps use `deriveIntuitionId` with the classification's inline declarative ladder; compare IID, winning rung, full derivation, canonical validation, and anchor eligibility. Compare all 37 ladder structures, including aggregate-rating's null ladder. | The strong-identifier projection is a different evaluator and is not substituted. The reference classification wrapper is unavailable publicly; its three invalid derivations are checked as derived strings followed by validation false. |
| Canonicalization | All 131 vectors compare the train and the recorded reference separately with corpus expectations using SCHEMES canonicalize, parse, norm1, and buildGen1Iid. gen1 preimages are reconstructed and hashed through public norm1/keccak16. | No preimage export is assumed; no typed-wd canonicalizer is tested at this base. |

No proof covers a database-backed runner, devnet, publication, live registry, provider calls, live configuration, or deployed behavior. The golden runner's database header is transcribed evidence only.

## Findings carried as entries

- No-identifier fallback envelope → ruling: the reference builds it and the public builder refuses it; two cases.
- `sameAs` omitted from identity envelopes → public-builder defect; the two movie cases retain the same gen1 IID but change anchor bytes and atom id.
- Derived recipe values not materialised → public-builder defect; the social-media-posting case emits raw text under `textHash`, the same class as geo7 evidence defects.

The required command reports **981 pass, 23 todo, 0 fail** across 6 files (1004 tests). Of those, the five harness files report 725 agreements and 110 known divergences (anchor proof: 32 agreements, 26 divergences, 23 OPEN); 146 passing tests come from the existing package conformance file.

## Mappings

`support/public.ts` resolves packages by name via public exports, asserts built `dist` resolution, and imports that resolved entry. The isolated workspace install does not link these packages at the root. Root resolution is attempted first; otherwise package self-references resolve through their existing public manifests, and viem resolves from its existing protocol consumer. No source entrypoints, new dependencies, or new workspace links are introduced.

`support/mappings.ts` matches each reference slug to the unique train classification with the same schema type. All 37 slugs currently map identically. The public evaluator receives `{slug, identifies, rungs: spec.identity.ladder}`. Winning rungs compare kind, scheme, stable tag, input field keys, and ordered recipe fields. Numeric indices are local to each declaration: structural sequence comparison separately detects missing/reordered rungs, including the missing Person OLID author rung.

Reference `buildAtomAnchor(spec, values, {candidateIid})` maps to public `buildIidAnchor(slug, values, options)`. Values pass unchanged. None of the reference options has an equivalent public option at this base: the candidateIid cases are explicitly OPEN; no override is manufactured by injecting fields. Public structured failures are normalized by meaning to INVALID_IID (failed identifier inspection) or Error; this does not establish parity of exception types/messages or fallback validation. Such gaps remain OPEN.

The golden reference's application category `song` corresponds to the public classification category `Media`; the harness asserts this explicit semantic mapping. It does not claim the public registry exports the reference's application category vocabulary. The golden classification's slug and schema type compare directly.

## Agreement matrix

| Corpus | Vectors | Train vs corpus: agree / diverge | Reference vs corpus: agree / diverge |
| --- | ---: | --- | --- |
| canonicalization | 101 | 101 / 0 | 101 / 0 |
| parse | 11 | 11 / 0 | 9 / 2 |
| norm1 | 13 | 13 / 0 | 13 / 0 |
| gen1 | 6 | 6 / 0 | 6 / 0 |
| Total | 131 | 131 / 0 | 129 / 2 |

All five wd canonicalization cases use bare QIDs and agree at this base. No wd case is hidden by an unconditional scheme exclusion. The two parse divergences are parse-009 (space) and parse-010 (non-ASCII); the reference parser must tighten to the corpus grammar. The separate uppercase parser-contract divergence also records the corpus's case-sensitive namespace rule.

## Adding a vector

Copy a new oracle case into the appropriate checked-in vector file, preserving its provenance, raw input, and recorded output. The historical parser corpus intentionally contains only the nine selected cases, with a provenance note identifying its different origin. Generated vector files retain the original provenance headers. Existing adapters enumerate all cases dynamically; an unknown corpus type, public derivation source, or provenance SHA fails explicitly. Add an adapter only using public exports. Run the harness before adding an entry to the divergence table, inspect the complete byte and identity difference, and keep the failing regression.

A package defect cannot be fixed here. Record its concrete input and output in the report and an explicit case entry with reason `defect, follow-up`. Keep unsupported capabilities OPEN with a specific reason. Never change an oracle expectation to make the train agree.

## Retiring a divergence

Each entry in `known-divergences.ts` carries a case id, which side changes, a one-sentence reason, and a removal condition. SHA-256 fingerprints pin the complete normalized observed and expected comparison outputs. For parse-009/010 the observed side is the reference parser, and the expected side is the corpus; for the protocol hex probe the expected side is the local validation invariant. Other entries compare the train with the recorded reference. Normalization sorts object keys but preserves strings and array order; serialized JSON and hex therefore remain byte-sensitive.

A listed test must still disagree and must still match both fingerprints. Agreement or any unexpected drift fails; orphaned, duplicate, and OPEN entries are rejected. After the specified fix/regeneration, remove the entry and let the ordinary equality test pass. For the odd-hex entry, replace the divergence with an explicit validator-rejection assertion when that follow-up lands. Never refresh fingerprints merely to silence a changed output.
