# Implementation Plan: Predicate Attributes End-to-End

**Status:** Build plan — ticket-ready
**Companion to:** `predicate-backend-integration.md` (the mapping/why), `predicate-spec-decisions.md` (the fields)
**Date:** 2026-06-30

Goal: take the 8 decided fields (+ soft-ship `claimType`, + `marketPattern`) from *declared in the package*
to *stored, seeded, queried, and consumed* in the backend. The backend has dormant schema slots but **zero
implemented behavior** — so this plan covers the whole path: package → schema → seed → query features →
consumers, with sequencing, dependencies, and acceptance criteria.

---

## 0. Verified ground truth (what we're building on)

- **KG is a separate, optional Postgres** (`DATABASE_KG_URL`), written by the projection
  `core_entities.rs`; it "graceful no-ops when absent." (verified: `core_entities.rs` header.)
- **The KG schema is NOT in committed migrations.** The numbered set `indexing-services/migrations/000–049`
  is the **TimescaleDB** event store. `kg.predicates`/`kg.triples` exist only in the test fixture
  `embeddings-job/tests/backfill_integration.rs`, described as "post-#437 shape." → **Prerequisite P0:
  locate/own the KG migration mechanism.**
- **The migration runner** is psql over `migrations/*.sql`, tracked in `schema_migrations`, keyed by
  `$DATABASE_URL` (`Dockerfile.migrations`). The KG DB needs its own runner/dir (different instance).
- **Predicate write path** `upsert_kg_predicate_lazy` (`core_entities.rs:485`) inserts only
  `(id, slug, label)` `ON CONFLICT (id) DO NOTHING` — it can never write or update our metadata.
- **Enabler:** the package already computes a stable **atom id per predicate** (`PREDICATE_IDS` in
  `predicates.ts`, via `calculateAtomId`). So a generated seed can carry **both `id` and `slug`** — the
  id↔slug mapping the integration doc worried about is solved at generation time.
- **Package build** runs generator scripts (`../../scripts/*.mjs`) then `tsc`; specs live (hand-authored)
  in `src/generated/specs/*.ts`; `PredicateSpec` is in `src/types.ts`; `definePredicateRecord` in
  `record.ts`.
- **Counter-triple scaffolding** already exists on `kg.triples` (`is_counter_triple`, `sibling_triple_id`)
  — the instance-level expression of our predicate-level `contradicts`.

---

## 1. Workstreams overview

| WS | Name | Repo | Outcome |
|---|---|---|---|
| **A** | Package = source of truth | `packages/predicates` | fields declared, validated, backfilled; seed artifact emitted |
| **B** | KG schema | `alpha/backend` (KG migrations) | columns/tables/indexes/constraints for all fields |
| **C** | Seed pipeline | both | package metadata lands in `kg.predicates` and stays in sync |
| **D** | Query features | `alpha/backend` | reverse-edge, transitive, roll-up, contradiction, validation actually work |
| **E** | API exposure | `alpha/backend/api` | predicate metadata + new query powers reach clients |
| **F** | Consumers | `recommendation-service` | polarity/transitive/specializes feed ranking |
| **G** | Test & observability | both | correctness invariants + perf guarded |

---

## 2. WS-A — Package (source of truth)

| ID | Task | Files | Size |
|---|---|---|---|
| A1 | Add fields to `PredicateSpec` (flat): `polarity`, `objectKind`, `literalType`, `temporalNature`, `claimType`, `isSymmetric` (exists), `isTransitive` (exists), `inverse: PredicateKey`, `specializes: readonly PredicateKey[]` (array — audit B1), `contradicts: PredicateKey[]`, `supersededBy: PredicateKey` | `src/types.ts` | S |
| A2 | `definePredicateRecord`: defaults + the **complete 14-rule derivation/validation set** (decision record §5.1 — incl. `specializes` acyclicity, contradiction closure down the hierarchy, no-contradiction-with-ancestor, `polarity ∧ isTransitive` error, `literalType ⟹ objectKind='literal'`, symmetric+transitive allow-list); typed-key refs resolve to known keys (build fails otherwise) | `src/record.ts` | M–L |
| A2b | **Canonical direction derivation** (audit A1): for each inverse pair, derive the canonical member (deterministic rule); export it in the record + seed so builders and the indexer agree | `src/record.ts` | S |
| A3 | Migrate `inversePredicate: string` → `inverse: PredicateKey` across specs | `src/generated/specs/*.ts` | S |
| A4 | Backfill **mechanical** fields across 133 specs: `polarity`, `objectKind`, `temporalNature` (scriptable, obvious values) | specs | M |
| A5 | Backfill **curated** fields: `specializes`, `contradicts`, `inverse` pairs, `claimType` (human review) | specs | M |
| A6 | New generator `scripts/generate-predicate-seed.mjs` → emits `dist/predicate-seed.json` (and optional `.sql`): one row per predicate with `{ id: PREDICATE_IDS[key], slug: key, label, description, isSymmetric, isTransitive, inverse→id, isCanonicalDirection, specializes→[id], contradicts→[id] (hierarchy-closed), polarity, objectKind, literalType, temporalNature, claimType, marketPattern, supersededBy→id }` — references resolved to atom ids | `scripts/`, `package.json` build | M |
| A7 | Tests: derivation/validation unit tests (one per §5.1 rule); seed snapshot test | `src/*.test.ts` | S |
| A8 | **Mint-time canonicalization in builders** (audit A1 — blocking, spans `@0xintuition/primitives` + `ids`): symmetric predicates → canonical subject/object ordering (by atom ID) before triple-ID computation; inverse pairs → normalize to the canonical direction from A2b. Both user intents resolve to one triple, one market | `primitives`, `ids` | M |

**Acceptance:** `bun run build` emits a deterministic seed artifact; invalid specs (one-sided inverse,
asymmetric `contradicts`, dangling key ref) fail the build.

---

## 3. WS-B — KG schema migrations

> Lands in the KG migration mechanism resolved in **P0**, against the `DATABASE_KG_URL` instance.

| ID | Task | Detail |
|---|---|---|
| B1 | Confirm existing columns | `is_symmetric`, `is_transitive`, `inverse_predicate_id`, `metadata` present in live KG (not just fixture) |
| B2 | Add predicate columns | `polarity text`, `object_kind text`, `market_pattern text`, `superseded_by_predicate_id text` (+ `claim_type`/`temporal_nature`/`literal_type` in `metadata` JSONB per the column-vs-JSONB heuristic) |
| B3 | Add `temporal_nature` | JSONB-first (`metadata->>'temporalNature'`); promote later if filtered |
| B4 | Inter-predicate join tables | `CREATE TABLE kg.predicate_contradictions (predicate_id text, contradicts_id text, PRIMARY KEY (predicate_id, contradicts_id))` — both directions, **hierarchy-closed at seed** (§5.1 rule 7). `CREATE TABLE kg.predicate_specializations (predicate_id text, specializes_id text, PRIMARY KEY (predicate_id, specializes_id))` — `specializes` is an array/DAG (audit B1), so a single column no longer fits |
| B5 | CHECK constraints | `polarity IN ('positive','negative','neutral')`, `object_kind IN ('entity','claim','literal')`, `market_pattern IN ('depositional','attributive','comparative')` |
| B6 | Reconcile backend-only flags | `is_hierarchical` (we cut it — derive `is_transitive AND inverse_predicate_id IS NOT NULL` at seed, or drop), `is_market` (superseded by `market_pattern` — backfill then deprecate), `is_social` (map from `category` or leave) |
| B7 | Triple indexes | `(subject_id, predicate_id)`, `(object_id, predicate_id)`, `(predicate_id)`, partial `WHERE inferred = false` (see integration doc §5.5) |

**Acceptance:** migrations apply cleanly on a fresh KG DB and on the post-#437 shape; fixture updated to match.

---

## 4. WS-C — Seed pipeline (the missing link)

| ID | Task | Detail |
|---|---|---|
| C1 | Seed loader | A backend step that reads `predicate-seed.json` (pinned package version) and upserts `kg.predicates` **`ON CONFLICT (id) DO UPDATE`** of the metadata columns; `metadata = kg.predicates.metadata || EXCLUDED.metadata` (merge). Implement as a small Rust seed binary in `projections` (has KG pool) or a generated SQL migration. |
| C2 | Reconcile with lazy path | Keep `upsert_kg_predicate_lazy` as-is (`DO NOTHING`, for unknown chain predicates). Seed owns metadata via `DO UPDATE`. Document the division: lazy = discovery, seed = truth. |
| C3 | Inter-predicate seeds | Populate `kg.predicate_contradictions` (both directions, hierarchy-closed — the package emits the closed set, the backend stores it verbatim) and `kg.predicate_specializations` from the artifact. |
| C4 | Ordering | Seed runs on deploy, idempotent, independent of ingestion order (keyed by atom id from the package). |
| C5 | CI sync | Package release regenerates the artifact; backend pins the package version; a CI check fails if the committed seed is stale vs the package. |

**Acceptance:** after seed, every enshrined/proposed predicate row in `kg.predicates` carries correct
metadata; re-running the seed is a no-op; changing a spec + re-seed updates the row.

---

## 5. WS-D — Query features (make the fields do work)

Default to **query-time** (no data migration); materialize only measured-hot paths.

| ID | Feature | Approach | Reads |
|---|---|---|---|
| D1 | Reverse-edge view (`isSymmetric`, `inverse`) | query-time rewrite: symmetric ⇒ match `subject_id=X OR object_id=X`; inverse ⇒ present reverse rows under the inverse predicate's label | needs B7 `object_id` index |
| D2 | Transitive closure (`isTransitive`) | bounded `WITH RECURSIVE` (depth cap ~8) helper | B7 `(subject_id,predicate_id)` |
| D3 | Roll-up (`specializes`) | load shallow hierarchy from `kg.predicates`; rewrite predicate filter to `predicate_id IN (descendants)` | B7 `(predicate_id)` |
| D4 | Contradiction detection + counter-triple wiring | the §5.4 join over `kg.predicate_contradictions`; on triple insert, if predicate `contradicts` an existing sibling `(subject,object)`, set `is_counter_triple=true`, link `sibling_triple_id` | join table + triple indexes |
| D5 | `objectKind` validation | at ingestion/API write, enforce `object_type` matches: `claim ⇒ object_type='triple'`, `literal ⇒` value, `entity ⇒ 'node'` | `object_type` column exists |
| D6 | (Phase 4) Materialize hot paths | inferred reverse edges + closure table, written `inferred=true` + provenance; **excluded from aggregates that count the origin**; **confidence = min over the derivation chain** (audit C3 — never copied, never 1.0), and inferred edges never re-enter inference across rules without a depth bound | partial indexes |
| D7 | Duplicate-triple backstop (audit A1) | detect symmetric duplicates (`⟨A,P,B⟩`+`⟨B,P,A⟩`, P symmetric) and inverse-pair duplicates (`⟨A,P,B⟩`+`⟨B,Q,A⟩`, `Q = inverse(P)`) minted before canonicalization (A8) or via raw protocol calls; link via `sibling_triple_id`-style reference; define aggregate-stake presentation policy | triple indexes |

**Where D1–D3 live:** the KG read layer the API uses (e.g. `api/src/clients/kg-workflows.ts` / KG read
crate). Centralize as reusable query builders so API + recommendation share them.

**Acceptance:** golden-query tests for each (reverse view returns origin's counterpart; closure respects
depth cap; roll-up expands correctly; contradiction query finds conflicts; invalid object_kind rejected).

---

## 6. WS-E — API exposure

| ID | Task | Files |
|---|---|---|
| E1 | `GET /api/predicates`, `GET /api/predicates/:id` returning the rendering contract (`objectKind`, `polarity`, `temporalNature`, `marketPattern`, relations) | `api/src/routes/`, new `predicates/` module |
| E2 | Extend triple hydration to include predicate metadata | `api/src/triples/surreal.ts` (+ KG read path, ENG-11475) |
| E3 | Query params: filter by `polarity`, opt-in roll-up expansion, `includeInferred` toggle (default exclude) | `api/src/routes/triples.ts` |

**Acceptance:** frontend can render an edge purely from the predicate response; inferred edges excluded by
default and labeled when included.

---

## 7. WS-F — Consumers (recommendation/reputation)

| ID | Task | Detail |
|---|---|---|
| F1 | polarity-aware scorer | new scorer reading `kg.predicates.polarity`; signed reweight; **exclude inferred** to avoid double count | 
| F2 | transitive trust chains | use `isTransitive` (D2) for "trusted-by-the-trusted" social signal |
| F3 | specializes interest widening | expand interest predicates via D3 |

(Recommendation currently reads only vaults/posts/events — these add KG reads. Scorer internals from
exploration are **unverified**; confirm before building.)

---

## 8. WS-G — Testing & observability

- G1 package unit tests (A7).
- G2 migration apply tests + update `backfill_integration.rs` fixture.
- G3 update `e2e-tests/08-dual-write-consistency.e2e.test.ts` for new predicate fields.
- G4 query-correctness tests for D1–D5.
- G5 **invariant test: no double-counting** — synthesized/rolled-up edges never summed with origins.
- G6 metrics: inferred-edge counts, closure-query latency, seed drift check.

---

## 9. Sequencing

```
P0  Prereqs ─ resolve KG migration mechanism; pin package↔backend versions
     │
P1  Foundation (additive, no behavior change) ── WS-A, WS-B, WS-C
     │   outcome: kg.predicates fully populated; dormant→live data
P2  Read features (query-time, no data migration) ── D1,D2,D3 + E1,E2
     │   outcome: reverse views, closure, roll-up, predicate API. MEASURE.
P3  Validation + contradiction ── D4,D5 (+ counter-triple alignment), E3
P4  Optimize hot paths ── D6 materialization + index tuning (only where P2 shows pressure)
P5  Consumers ── WS-F recommendation signals
```

P1–P2 are low-risk and unlock most of the value (rendering contract + roll-up + reverse views). Everything
after is opt-in optimization and new product surface.

---

## 10. Cross-cutting invariants & risks

- **No double-counting** (biggest correctness trap): inferred + rolled-up edges excluded from aggregates
  that already count the origin. Enforced by G5 and "exclude inferred by default."
- **No split-stake duplicates** (audit A1): one fact, one triple, one market. Mint-time canonicalization
  (A8) is primary; D7 detect-and-link is the backstop. Ship A8 **with or before** any reverse-edge
  synthesis feature — synthesis without canonicalization encourages fragmentation.
- **Confidence decay** (audit C3): inferred-edge confidence = min over the derivation chain; inferred
  edges don't re-enter inference unbounded.
- **Conflict detection is pair-level** (audit A2): the D4 join fires on same ⟨subject, object⟩ with
  disjoint predicates. Attester-level disagreement about an object is a `polarity` aggregate, not a
  contradiction — don't conflate the two queries.
- **OWA**: contradiction and "current state" read only explicit assertions; never infer negation from absence.
- **Replay safety**: seed and lazy paths both idempotent; seed `DO UPDATE` vs lazy `DO NOTHING` must not fight.
- **KG-optional**: all features graceful when `DATABASE_KG_URL` absent (matches current projection behavior).
- **Schema drift**: confirm live KG vs fixture (P0); resolve the predicate-FK discrepancy.
- **Version coupling**: backend seed pins a package version; CI guards drift (C5).

---

## 11. P0 prerequisites to unblock (answer these first)

1. Where do KG migrations live / how is the `DATABASE_KG_URL` schema versioned (the post-#437 mechanism)?
2. Is the fixture shape (`is_symmetric` etc.) actually deployed, or still in flight in #437?
3. Predicate FK: does `kg.triples.predicate_id` reference `kg.predicates(id)` in the live DB?
4. Has the API committed to the KG read path (ENG-11475), or do we extend SurrealDB queries meanwhile?
5. Recommendation-service scorer internals — verify before WS-F.

---

## 12. Rough sizing

| Phase | Effort (eng-weeks, rough) | Risk |
|---|---|---|
| P0 prereqs | 0.5 (mostly investigation) | unblocks everything |
| P1 foundation | 2–3 | low (additive) |
| P2 read features | 2–3 | low–med (query correctness) |
| P3 validation/contradiction | 2 | med (ingestion path, counter-triple) |
| P4 optimization | 1–2 | med (write amplification) |
| P5 consumers | 1–2 | low (additive reads) |

These are order-of-magnitude; the curated backfill (A5) and counter-triple alignment (D4) are the most
estimate-sensitive.
