# Community call — package walkthrough agenda (2026-08-20)

**Length:** 20–30 min walkthrough + live Q&A
**Branch to present from:** `update/v1.1.0-alpha` (the v1.1.0-alpha release train)
**Shape:** bottom-up through the dependency graph. Each stop = *open this file → say this → show this concept*.

## Running example (use it at every layer)

One entity carried all the way up: **a music recording** ("One More Time").
It already powers the README and `examples/hackathon-quickstart`, so every layer has real code for it.

```text
ids        → what an atom ID *is* (keccak of the data)
iid-spec   → what name the recording gets:  int:isrc:…   (or int:gen1:music-recording:r3:… if we only know the name)
iid        → the engine that mints that name deterministically
classif.   → the music-recording spec declares *which* identifiers to try, in which order
registry   → int:isrc:… ⇒ classification "music-recording", providers [musicbrainz, spotify…]
ladder     → messy app input (ISRC? Spotify URL? handle?) ⇒ one IID or an explicit fallback
primitives → buildIidAnchor('music-recording', values) ⇒ atom data + URI context, offline
protocol   → createAtomsWithUris(...) puts it on-chain, with creation-time URI context
react      → useCreateAtomFlow() wraps that for apps
```

## Dependency graph (show once at the start)

```text
leaves:        ids   iid-spec   iid   schema-org   deployments   curves
                │               │                      │            │
semantic:   predicates     classifications             │            │
                │               │                      │            │
resolution:     │        iid-registry  iid-ladder      │            │
                │               │                      │            │
builders:       └──── primitives ┘                 periphery    protocol
                                                                   │
app layer:                                                       react
                                                                   │
                                                   examples/hackathon-quickstart
```

---

## Timeline

| Clock | Stop | Packages |
| --- | --- | --- |
| 0:00–2:00 | 1. Orientation | repo layout, layers, release train |
| 2:00–5:00 | 2. Deterministic protocol IDs | `ids` |
| 5:00–9:00 | 3. Naming real-world things | `iid-spec`, `iid` |
| 9:00–12:00 | 4. Vocabulary | `classifications`, `predicates` (+ `schema-org` in one breath) |
| 12:00–15:00 | 5. Resolution | `iid-registry`, `iid-ladder` |
| 15:00–19:00 | 6. Builders | `primitives` |
| 19:00–23:00 | 7. Chain plumbing | `protocol` (+ `deployments`, `curves`, `periphery`) |
| 23:00–26:00 | 8. App layer | `react` |
| 26:00–28:00 | 9. Everything together | `examples/hackathon-quickstart` |
| 28:00+ | Q&A | — |

If running long: compress stops 4 and 7 (they're the most "data-shaped"), never stop 3 or 6 — those are the new ideas in this release.

---

## 1. Orientation (2 min)

**Open:** `README.md` (Package Layers table) · `.planning/iid-v1.1.0-alpha/index.md` (PR dependency graph)

**Say:**
- 14 ESM-only TypeScript packages under `@0xintuition/*`, independent semver, Bun + Turbo workspace.
- Four layers: semantic/data modeling → identity → builder helpers → protocol plumbing.
- This branch is the **v1.1.0-alpha release train**: four new IID packages, classification ladders reconciled, canonical atom anchor builder, and new URI-aware creation APIs in `protocol` + `react`.
- Design tenets that show up everywhere: **pure / offline / deterministic** (no wallet, no fetch, no clock) in every package below `protocol`.

---

## 2. `@0xintuition/ids` — deterministic protocol IDs (3 min)

**Open:**
- `packages/ids/src/atom-id.ts:30` — `calculateAtomId`
- `packages/ids/src/triple-id.ts:27` / `:51` — `calculateTripleId`, `calculateCounterTripleId`

**Say:** Every atom, triple, and counter-triple ID is computable **off-chain, before you spend gas**. The algorithm mirrors the contracts: `keccak256(salt ‖ keccak256(data))`. Same data ⇒ same ID, for anyone, forever.

**Concept:** *content addressing.* You can check "does this atom already exist?" and build whole graphs client-side with no RPC. This is the floor everything above stands on.

**Live one-liner:**
```ts
import { calculateAtomId } from '@0xintuition/ids'
calculateAtomId('hello') // 0xa0e157e5…  — same on every machine
```

---

## 3. `@0xintuition/iid-spec` + `@0xintuition/iid` — naming real-world things (4 min)

**Open:**
- `packages/iid-spec/README.md` (top: the four example IIDs) — **spend 60s here, it's the best pitch in the repo**
- `packages/iid-spec/conformance/` — machine-readable, versioned test vectors (`canonicalization.json`, `gen1.json`, `norm1.json`…)
- `packages/iid/src/derive.ts:31` — `deriveIntuitionId` (the ladder engine; read the doc comment aloud)
- `packages/iid/src/gen1.ts` — `buildGen1Iid` (what happens when no registry covers the thing)
- `packages/iid/src/schemes.ts:458` — `isbn: define('isbn', 'A', canonicalizeIsbn)` (one line = one scheme)

**Say:**
- Problem: two people describing the same book should produce the **same identifier, character for character, without coordinating**.
- `iid-spec` is the *normative* doc (RFC-2119 MUST/SHOULD), 26 schemes, each with grammar + ordered canonicalization + vectors. `iid` is the *reference implementation* and is tested against those vectors — the spec is executable.
- Identity **classes**: A = registered authority (ISBN, Wikidata), B = intrinsic key (CAIP-10 account), C = derived (`gen1`). Strength is ranked, not assumed.
- `gen1`: when you only have a name, hash a NORM-1-normalized, key-sorted recipe ⇒ `int:gen1:music-recording:r3:<keccak16>`. Still deterministic; honestly labeled weaker.

**Concept:** *ladders are data.* `deriveIntuitionId(ladder, values)` walks rungs strongest-first; two engines given the same ladder + same fields MUST return the same IID. No code per entity type.

**Live one-liner:**
```ts
import { parseIntuitionId, inspectIntuitionId } from '@0xintuition/iid'
inspectIntuitionId('int:isbn:9780684832722') // scheme, class, anchor-eligible…
```

---

## 4. `@0xintuition/classifications` + `@0xintuition/predicates` — vocabulary (3 min)

**Open:**
- `packages/classifications/src/generated/specs/music-recording.ts` → scroll to `identity.ladder` (isrc → mbid via sameAs → gen1 on `name`). *This is where stop 3's ladder actually lives.*
- `packages/classifications/src/creation-profile.ts:64` — `CreationProfile` (fields + relationships: what a form needs)
- `packages/classifications/src/classifications.ts:48` — `identityLadderFor(slug)`
- `packages/predicates/src/predicates.ts:33` — `PREDICATE_IDS` (every canonical predicate's atom ID is precomputed via `ids`)
- `packages/predicates/src/standalone/` — one file per predicate (`hasTag`, `vouchFor`, `equivalentTo`…)

**Say:**
- Classifications = "what kind of thing is this atom and what fields does it carry" — pinned to `schema-org` vocabulary, generated, with **Creation Profiles** that drive UIs (fields) and suggest triples (relationships).
- Predicates = the canonical relationship registry with deterministic IDs and display helpers. Mention the metadata-predicate matrix: it says which `(subjectType, predicate, objectType)` combos are valid, so apps can't mint nonsense triples.
- Both are *data packages*: generated, checked in CI (`classifications:check-creation-profiles`, `predicates:check-generated`).

**Concept:** *no app-local shadow maps.* Forms, pickers, and validators all read the same spec.

---

## 5. `@0xintuition/iid-registry` + `@0xintuition/iid-ladder` — resolution (3 min)

**Open:**
- `packages/iid-registry/src/classification.ts:74` — `classificationForIid`
- `packages/iid-registry/src/providers.ts:99` — `providersForIid`
- `packages/iid-registry/src/hints.ts:95` — `identifierHintsForIid`
- `packages/iid-ladder/src/ladder.ts:18` — `LadderResult` type (read it: `strong | handle | url`, or an **explicit** `envelope` fallback with a reason)
- `packages/iid-ladder/src/ladder.ts:53` — `projectIdentifierLadder`

**Say:**
- `iid-registry` is the semantic bridge: IID grammar ⇒ Intuition classification + provider slugs. Pure lookup tables; "which schemes unambiguously imply a type?" lives here.
- `iid-ladder` is the *input-side* counterpart: apps and seed scripts hand over whatever they have (strong identifiers, a provider handle, a canonical URL) and get back **one IID or a typed reason why not**. Never a silent downgrade — `unregistered-provider`, `url-over-cap` (220 chars), etc.

**Concept:** *explicit fallbacks over guessing.* The return type makes every failure mode a value your UI can act on.

---

## 6. `@0xintuition/primitives` — the builder layer (4 min)

**Open:**
- `packages/primitives/src/anchor.ts:98` — `buildIidAnchor` (read the doc comment on P0 vs P1 — this is the headline API of the release)
- `packages/primitives/src/atom.ts:30` — `buildAtom`, plus typed helpers `buildMusicRecording`, `buildPerson`, `buildEthereumAccount`…
- `packages/primitives/src/triple.ts:32` / `:89` — `buildTriple`, `buildCounterTriple`
- `packages/primitives/src/validate.ts:88` — `recognizeAtomData` → `'iid-anchor' | 'json-object' | 'invalid'`
- `packages/primitives/src/discover.ts:117` — `suggestClassification(values)`

**Say:**
- This is where the five packages below meet: classification spec → identity ladder → `deriveIntuitionId` → registry hints → atom data + URI manifest. One call, offline, returns `{ success, errors }` — never throws on bad input.
- **Representation profiles:** `p0` = atom data *is* the bare IID string (only for Class A/B on an unambiguous scheme) — the only profile that gets **protocol-level dedupe** because `atomId = calculateAtomId(iid)`. `p1` = deterministic JSON with `@type` + the identity fields the rung consumed — required floor for Class C / polymorphic schemes. Asking for `p0` when ineligible is a structured error.
- Blueprints carry their precomputed IDs (`ids`), so a triple's ID is known before anything is written.

**Concept:** *strongest legal profile by default; downgrade only on purpose.*

**Live one-liner (the money shot):**
```ts
import { buildIidAnchor } from '@0xintuition/primitives'
buildIidAnchor('music-recording', { isrc: 'GBAYE0000351', name: 'One More Time' })
// → p0 anchor: atom data "int:isrc:GBAYE0000351", atomId, classification, providers, uris…
buildIidAnchor('music-recording', { name: 'One More Time' })
// → gen1 rung fires → Class C → p1 JSON payload
```

---

## 7. `@0xintuition/protocol` (+ `deployments`, `curves`, `periphery`) — chain plumbing (4 min)

**Open:**
- `packages/protocol/src/core/multivault/index.ts` — the surface area: one file per contract function (read/write/encode/preview)
- `packages/protocol/src/core/multivault/create-atoms-with-uris.ts:29` — `multiVaultValidateCreateAtomsWithUris` (local validation) and `:63` — `multiVaultCreateAtomsWithUris` (simulate → write)
- `packages/protocol/src/events/multivault/atom-creation-context.ts:10` — `associateAtomCreationContext` (joins `AtomCreated` ↔ URI-context events by `termId`, *not* log position)
- `packages/protocol/src/contracts/contracts-v2-provenance.ts` — ABIs are synced from `@0xintuition/contracts-v2` and pinned; `protocol:check-artifacts` in CI
- 30 seconds each: `packages/deployments/src/networks.ts` (viem `defineChain` for Intuition testnet/mainnet) · `packages/curves/src/linear-curve.ts` (off-chain share-price math matching the contracts) · `packages/periphery/src/trust-swap-and-bridge-router/` (bridge/route helpers)

**Say:**
- `protocol` is 3.x (supersedes the old monolithic package). viem-native, tree-shakeable, typed from the ABI.
- New this release: `createAtomsWithUris` — the atom's URI/creation context travels with the creation tx, so the IID anchor from stop 6 lands on-chain with its provenance. Local validation catches what can be known offline (lengths, `value == Σ assets`, live URI limits if you fetched `getAtomUriConfig`); **simulation stays the authority** for cost, duplicates, approvals.
- Encode variants (`*-encode.ts`) exist for every write so wallets/batchers/AA flows can build calldata without a client.

**Concept:** *validate locally, simulate always, decode deterministically.*

---

## 8. `@0xintuition/react` — app layer (3 min)

**Open:**
- `packages/react/src/provider.tsx:81` — `IntuitionProvider` (wagmi + react-query underneath; chain config resolved from `deployments`)
- `packages/react/src/hooks/use-transaction-flow.ts:78` — `useTransactionFlow` (the generic simulate → sign → confirm state machine every write hook reuses)
- `packages/react/src/hooks/use-create-atom-flow.ts:104` — `useCreateAtomFlow` (returns `createAtom`, `atomCost`, `status`, `hash`, `receipt`, `error`, `reset`; parses `AtomCreated` from the receipt)
- `packages/react/src/hooks/use-protocol.ts` — read hooks (`useAtomCost`, `usePreviewAtomCreate`, `useIsTermCreated`…)

**Say:**
- Thin by design: hooks call `protocol` functions; no logic lives only in React. Read hooks are react-query keyed by chain; write hooks share one flow status type so UIs render one transaction component.
- Show the shape: `useIsTermCreated(calculateAtomId(data))` is how an app asks "already exists?" before paying — stops 2 and 8 meet here.

**Concept:** *hooks are adapters, not a second implementation.*

---

## 9. Everything together — `examples/hackathon-quickstart` (2 min)

**Open / run:** `cd examples/hackathon-quickstart && bun run dev` (dry-run; no wallet, no API key)
- `src/identity-linking.ts` — the Spotify / Apple Music / MusicBrainz candidates, confidence scored, split into *payload* vs *sameAs* links
- `src/package-lifecycle.ts` — Creation Profile → atom data → IDs → triples, end to end

**Say:** this is the whole stack for the running example in one screen: profile fields drive the form, ladder/registry pick the identity, `ids` gives deterministic IDs, `protocol`/`react` would submit.

---

## Q&A prep — likely questions and where the answer lives

| Question | Answer / pointer |
| --- | --- |
| "Why not just hash the name?" | Names fork (casing, diacritics, feat. credits). Classes A/B first; `gen1` is the *labeled* last resort with NORM-1 + fixed recipe. `iid-spec/explainer.md`, `spec/06-gen1.md`. |
| "What if two IIDs refer to the same thing?" | Out of scope for IIDs by design — that's `equivalentTo` / `sameAs` triples. `iid-spec/spec/08-equivalence.md`. |
| "Can I add a scheme / classification?" | Scheme: `iid-spec/spec/09-registry-governance.md` + `iid/src/schemes.ts`. Classification: generated specs + `classifications:generate-creation-profiles`. |
| "Is p0 dedupe enforced on-chain?" | Yes, because p0 atom data *is* the IID string and `atomId = calculateAtomId(iid)`; p1 payloads dedupe only if byte-identical. `primitives/src/anchor.ts` doc comment. |
| "Do I have to use React?" | No. `protocol` is plain viem; `react` is a thin adapter. |
| "How are ABIs kept honest?" | Synced from `@0xintuition/contracts-v2` with pinned provenance; `protocol:check-artifacts` fails CI on drift. |
| "Release/publish process?" | `docs/release.md`; tarball smoke + supply-chain guard scripts in `scripts/`. The train is PR #15 (`update/v1.1.0-alpha` → `main`). |
| "Which packages are new in this train?" | `iid-spec`, `iid`, `iid-registry`, `iid-ladder` (all 0.1.0-alpha.0); `classifications`/`primitives`/`react` bumped to alpha.1; `protocol` 3.1.0. `.planning/iid-v1.1.0-alpha/index.md`. |

## Before the call (5-min checklist)

- [ ] `bun install && bun run build` on `update/v1.1.0-alpha` so `dist/` exists for the one-liners
- [ ] Pre-open the files above in editor tabs in stop order (9 groups)
- [ ] Run the stop-6 `buildIidAnchor` one-liners once and keep the output visible — confirm the exact field names match the current `music-recording` spec
- [ ] Have `examples/hackathon-quickstart` dev server already running in a second terminal
- [ ] Have PR #15 open in a browser tab for the "what's shipping" question
