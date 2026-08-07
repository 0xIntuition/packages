# Backend Integration: Activating Machine-Readable Predicate Fields

**Status:** Draft for review
**Companion to:** `predicate-spec-decisions.md` (the field set)
**Backend mapped:** `alpha/backend` (branch `kames/simplify-feed`), 2026-06-30
**Scope:** how the 8 shipped fields reach the backend, get stored/indexed, and optimize queries

> ⚠️ **Verification caveat.** The KG schema below is read from the test fixture
> `indexing-services/crates/embeddings-job/tests/backfill_integration.rs` (it references PR "#437"). The
> field `is_symmetric` appears **only** in that fixture, not in committed migrations — so the canonical
> `kg.predicates` shape should be confirmed against the live `DATABASE_KG_URL` migrations before building.
> The architecture, write path, and `core_entities.rs` details are verified from source.

---

## 1. Executive summary — the schema already anticipated this

The most important finding: **the backend is already shaped for this work, but the fields are dormant.**

`kg.predicates` already declares `is_symmetric`, `is_transitive`, `is_hierarchical`,
`inverse_predicate_id`, and a `metadata jsonb` column. `kg.triples` already has `inferred boolean` and
`confidence numeric` — purpose-built for *synthesized* edges — plus `sibling_triple_id` /
`is_counter_triple` scaffolding for counter-claims. So we are not adding net-new infrastructure. There
are exactly **three gaps**:

1. **Seed** — nothing writes *real* metadata into `kg.predicates`. The ingestion path lazy-upserts only
   `(id, slug, label)` and `ON CONFLICT DO NOTHING`, so even pre-seeded rows never receive our fields.
2. **Populate the new fields** — `polarity`, `objectKind`, `temporalNature`, `specializes`, `contradicts`,
   and a real `marketPattern` enum have no home yet (columns or JSONB).
3. **Consume** — nothing reads predicate metadata. No reverse-edge synthesis, no transitive closure, no
   roll-up; the recommendation service doesn't read `kg.predicates` at all. The graph's *semantics* are
   currently invisible to queries and ranking.

This doc addresses all three, with the query/performance work concentrated in gap 3.

---

## 2. Current architecture (verified)

Event-sourced, Rust ingestion → Postgres read models, with a TypeScript API.

```
chain events ──> TimescaleDB event_store (hypertable, append-only)
                      │  (rindexer-ingestion → event_data JSONB)
                      ▼
                 projections (Rust, tokio + sqlx; Coordinator-supervised)
                      │  CoreEntitiesProjection dual-writes:
                      ├──> TimescaleDB `term` (denormalized, legacy)
                      ├──> SurrealDB (legacy, retiring)
                      └──> KG Postgres (canonical): kg.nodes, kg.predicates, kg.triples, kg.events
                                 │
                      embeddings-job ──> search.documents (pgvector)
                                 │
   API (Hono/TS) reads SurrealDB today, KG fallback in progress (ENG-11475)
   recommendation-service (Rust/Axum) reads vaults + posts + events (NOT predicates)
```

### Verified schema (KG Postgres)

`kg.predicates` — `backfill_integration.rs:134`:
```sql
id text PK, slug text UNIQUE, label text, description text,
inverse_predicate_id text,
is_transitive  boolean NOT NULL DEFAULT false,
is_symmetric   boolean NOT NULL DEFAULT false,
is_hierarchical boolean NOT NULL DEFAULT false,
is_social      boolean NOT NULL DEFAULT false,   -- backend-only, not in our spec
is_market      boolean NOT NULL DEFAULT false,   -- backend-only, not in our spec
metadata       jsonb NOT NULL DEFAULT '{}',
created_at, updated_at
```

`kg.triples` — `backfill_integration.rs:151`:
```sql
id text PK, status text DEFAULT 'active', visibility text DEFAULT 'public', created_by text,
subject_id text, subject_type text DEFAULT 'node',
predicate_id text REFERENCES kg.predicates(id), predicate_type text DEFAULT 'node',
object_id text, object_type text DEFAULT 'node',
edge_kind text DEFAULT 'claim', source text, source_uri text,
confidence numeric(6,5),            -- ready for synthesized-edge confidence
inferred boolean NOT NULL DEFAULT false,   -- ready for synthesized edges
provenance jsonb DEFAULT '{}', metadata jsonb DEFAULT '{}'
-- (+ sibling_triple_id / is_counter_triple per the counter-triple work)
```

### Verified write path

`indexing-services/crates/projections/src/projection/dual/core_entities.rs:485` —
`upsert_kg_predicate_lazy()`:
```sql
INSERT INTO kg.predicates (id, slug, label)
VALUES ($1, $1, $1)
ON CONFLICT (id) DO NOTHING
```
The chain emits `predicate_id` as a **bytes32 atom hash**; pre-seeded predicates (`pred_follows`, …) keep
their curated `slug`/`label` because `DO NOTHING` short-circuits. **Consequence:** this path can *never*
introduce or update our metadata — seeding must be a separate, slug-keyed upsert that runs `DO UPDATE`
(see §4). Note also a discrepancy to resolve: the code comment says `predicate_id` has **no FK** to
`kg.predicates`, but the fixture declares `REFERENCES kg.predicates(id)`. Confirm which is live before
relying on referential integrity.

---

## 3. Field → backend home

| Field (spec) | Backend today | Recommendation |
|---|---|---|
| `isSymmetric` | ✅ `is_symmetric` column | reuse as-is |
| `isTransitive` | ✅ `is_transitive` column | reuse as-is |
| `inverse` | ✅ `inverse_predicate_id` column | reuse; store the **predicate atom-id**, mapped from our typed `PredicateKey` at seed time |
| `specializes` (array, per audit B1) | ❌ | join table `kg.predicate_specializations(predicate_id, specializes_id)` — a DAG needs many-to-many; mirrors the contradictions table (a `text[]` column also works, but the join table keeps both inter-predicate relations uniform) |
| `contradicts` | ❌ (but `is_counter_triple`/`sibling_triple_id` scaffolding exists) | add join table `kg.predicate_contradictions(predicate_id, contradicts_id)` — many-to-many, symmetric; **seeded with the hierarchy-closed set** (audit B2 rule 7: `P ⊑ Q ∧ Q ⊥ R ⟹ P ⊥ R` expanded at seed time, so the conflict join never walks `specializes` at query time) |
| `polarity` | ❌ | **dedicated column** `polarity text` — it's a hot query/filter axis (reputation, feed) |
| `objectKind` | ❌ | **dedicated column** `object_kind text` — drives validation + render, queried often |
| `literalType` (audit A3) | ❌ | `metadata->>'literalType'` JSONB — rendering/validation reads it via the registry, not as a SQL filter |
| `temporalNature` | ❌ | `metadata->>'temporalNature'` JSONB first; promote to column if it becomes a query filter |
| `claimType` | ❌ | `metadata->>'claimType'` JSONB (soft-ship; low traffic) |
| `supersededBy` (audit D1) | ❌ | `superseded_by_predicate_id text` (mirrors `inverse_predicate_id`; nullable, rare) |
| `marketPattern` | ⚠️ only `is_market boolean` | add `market_pattern text` (3-value); reconcile/retire the boolean |
| — | `is_hierarchical` exists | our spec **cut** this (derivable). Either derive it at seed (`is_transitive AND inverse_predicate_id IS NOT NULL`) or drop the column |
| — | `is_social` exists | backend-only flag; map from our `category` at seed time or leave to backend |

**Column vs JSONB heuristic:** promote a field to a real column when it's a *query filter or index target*
(`polarity`, `objectKind`, `market_pattern`); keep rarely-filtered descriptive fields in `metadata` JSONB
(`temporalNature`, `claimType`) until a query needs them. This keeps the hot path indexable without
over-widening the table.

---

## 4. Closing gap 1+2 — the seed path (the critical missing link)

The package `@0xintuition/predicates` already *generates* `PREDICATE_SPECS`. Extend that generation to
emit a **seed artifact** the backend consumes, keyed by `slug` (stable) — not by the chain atom-hash `id`.

**Recommended mechanism:** a generated, idempotent seed run as a migration/job:
```sql
INSERT INTO kg.predicates
  (id, slug, label, description, is_symmetric, is_transitive,
   inverse_predicate_id, specializes_predicate_id, polarity, object_kind,
   market_pattern, metadata)
VALUES (...)  -- one row per spec
ON CONFLICT (slug) DO UPDATE SET     -- ⬅ UPDATE, unlike the lazy path's DO NOTHING
  is_symmetric = EXCLUDED.is_symmetric,
  ... ,
  metadata = kg.predicates.metadata || EXCLUDED.metadata,  -- merge, don't clobber chain-added keys
  updated_at = now();
```

Key design points:
- **Slug-keyed**, so it's stable across redeploys and independent of the chain atom-hash id.
- **`DO UPDATE`** so spec changes propagate (the ingestion path's `DO NOTHING` deliberately won't).
- **JSONB merge** (`||`) so seeded metadata coexists with anything the pipeline writes.
- Resolve `inverse`/`specializes` typed keys → predicate ids/slugs **at generation time** in the package,
  where the key graph is validated by `definePredicateRecord`. The backend stores resolved references.
- Ordering: seed must run **before or alongside** ingestion so lazy-upserted rows (id-keyed) and seeded
  rows (slug-keyed) reconcile. Confirm the id↔slug mapping (the bytes32 atom hash ↔ `pred_follows`) is
  available at seed time; if not, that mapping table is a prerequisite.

This makes the package the single source of truth and the backend a projection of it — the right direction.

---

## 5. Closing gap 3 — query optimization & performance (the payoff)

### 5.1 Reverse-edge synthesis (`isSymmetric`, `inverse`)

> **Prerequisite (audit A1 — blocking):** synthesis handles the *read* side only. On the *write/mint*
> side, `⟨A, partnerOf, B⟩` and `⟨B, partnerOf, A⟩` hash to two triple IDs → **two vaults**, splitting
> stake on one fact; likewise inverse pairs (`employedBy`/`employs`). Primary fix is **mint-time
> canonicalization in the package/builders** (decision record §5.2): canonical subject/object ordering
> for symmetric predicates, canonical direction for inverse pairs. The backend's job is the **backstop**:
> detect symmetric/inverse duplicates already minted (or arriving via raw protocol calls) and link them —
> same `sibling_triple_id` pattern as counter-triples, plus an explicit policy for presenting their
> aggregate stake. Without both halves, synthesis *encourages* liquidity fragmentation.

Two strategies; choose per access pattern:

- **Query-time rewrite (recommended default for `isSymmetric`).** To answer "edges touching X," query both
  positions: `WHERE subject_id = X OR object_id = X` for symmetric predicates, presenting the reverse view
  without storing it. Zero write amplification. Needs an index on `object_id` (see 5.5).
- **Materialization (recommended for hot `inverse` pairs).** A follow-up projector reads
  `is_symmetric`/`inverse_predicate_id` and writes the reverse row into `kg.triples` with
  **`inferred = true`**, `source = 'synthesis'`, and provenance pointing at the origin triple. The schema's
  `inferred` column exists precisely for this. Pros: read-simple, single-position queries. Cons: ~2× rows
  for affected predicates, and synthesized rows must be regenerated if the origin is redacted.

Guidance: start query-time (no migration of data), materialize only predicates proven read-heavy. Never
materialize *and* double-count in reputation — tag inferred edges and exclude them from any aggregate that
already counts the origin.

### 5.2 Transitive closure (`isTransitive`)

- **Bounded recursive CTE at query time (recommended first).** Postgres `WITH RECURSIVE` over `kg.triples`
  filtered to the transitive predicate, with a **depth cap** (e.g. 8) to bound cost on long ranking chains:
  ```sql
  WITH RECURSIVE reach AS (
    SELECT object_id, 1 AS depth FROM kg.triples
      WHERE subject_id = $1 AND predicate_id = $2
    UNION ALL
    SELECT t.object_id, reach.depth + 1 FROM kg.triples t
      JOIN reach ON t.subject_id = reach.object_id
      WHERE t.predicate_id = $2 AND reach.depth < 8
  ) SELECT DISTINCT object_id FROM reach;
  ```
- **Materialized closure table** (`kg.transitive_closure(predicate_id, ancestor, descendant)`) if a
  containment/org query becomes hot. Higher write cost, O(1) reads. Defer until measured.

### 5.3 Roll-up (`specializes`)

Cheapest of all: maintain an in-memory predicate-hierarchy map (small, from `kg.predicates`) and **rewrite
the query** to expand a general predicate to its descendants:
`affiliatedWith` → `predicate_id IN (employedBy, alumniOf, memberOf, affiliatedWith)`. One indexed `IN`
scan, no recursion at the data layer (the hierarchy is shallow). This is pure OWL 2 RL and very fast.

### 5.4 Contradiction detection (`contradicts`)

The disagreement query: for an entity, find `(subject, object)` pairs asserted with both a predicate and
one of its `contradicts` partners.
```sql
SELECT a.subject_id, a.object_id, a.predicate_id, b.predicate_id
FROM kg.triples a
JOIN kg.predicate_contradictions c ON c.predicate_id = a.predicate_id
JOIN kg.triples b ON b.subject_id = a.subject_id
                 AND b.object_id  = a.object_id
                 AND b.predicate_id = c.contradicts_id;
```
This is also where the existing **counter-triple** scaffolding (`is_counter_triple`, `sibling_triple_id`)
connects: a `contradicts`-declared pair *is* the predicate-level rule that the counter-triple feature
expresses at the instance level. Recommend aligning the two so a counter-triple is recognized
automatically when its predicate `contradicts` the sibling's. **OWA caveat:** detect conflict only from
*explicitly asserted* contradictory edges — never infer a negative from absence (foundations doc, Part IV).

### 5.5 Indexing recommendations

`kg.triples` currently has only PK + the predicate FK. The query patterns above need:
```sql
CREATE INDEX ON kg.triples (subject_id, predicate_id);      -- forward edges / closure seed
CREATE INDEX ON kg.triples (object_id, predicate_id);       -- reverse edges / symmetric & inverse views
CREATE INDEX ON kg.triples (predicate_id);                  -- roll-up IN-scans, per-predicate analytics
-- partial indexes for hot filtered axes once polarity/object_kind are columns:
CREATE INDEX ON kg.triples (subject_id) WHERE inferred = false;   -- exclude synthesized in base views
```
On `kg.predicates`, index `polarity` and `object_kind` only if predicate-level filtering (not just join)
becomes common; the table is tiny (hundreds of rows), so a seq-scan there is usually fine.

---

## 6. Consumer integration

- **recommendation-service** (`recommendation-service/src/scorers/`): a new scorer (or a `prepare()`
  extension) can read `kg.predicates` to (a) reweight by `polarity` — downrank entities carrying
  stake-weighted negative edges; (b) follow `isTransitive` trust chains for "trusted-by-the-trusted"
  social signal; (c) use `specializes` to widen interest matching. Today it reads only vaults/posts/events,
  so this is additive. *(Scorer weights cited by exploration not independently verified.)*
- **API** (`api/src/triples/surreal.ts`, `routes/triples.ts`): extend the hydrated predicate object to
  include the new fields, and add a `GET /api/predicates/:id` (none exists today) so clients/the frontend
  get the rendering contract (`objectKind`, `polarity`, `temporalNature`) without bundling the package.
- **Validation**: `objectKind` enables an ingestion-time (or API-time) check that `object_type` matches
  (`literal` ⇏ a node id; `claim` ⇒ object is a triple id, i.e. `object_type = 'triple'`). The
  `object_type` column already distinguishes `'node' | 'triple'`, so `objectKind: 'claim'` maps directly.

---

## 7. Risks & performance characteristics

- **Write amplification** from materialized synthesis/closure — mitigate by defaulting to query-time and
  materializing only measured-hot predicates; always tag `inferred = true` and exclude from aggregates that
  count the origin.
- **Inferred-edge confidence decay (audit C3).** `kg.triples.confidence` exists for exactly this; the
  policy must be explicit: an inferred edge's confidence is a **non-increasing function of its derivation
  chain** — `min` of the constituent confidences (the conservative standard from the probabilistic-KG
  line: PSL, Knowledge Vault) — never a copy of one constituent, never `1.0`. And inferred edges must not
  feed further inference rounds across different rules without a depth bound, or materialization loops.
  Skipping this paragraph is how "everything is 100% confident" graphs happen.
- **Duplicate symmetric/inverse triples** (audit A1) — see §5.1 prerequisite; mint-time canonicalization
  in the package is primary, backend detect-and-link is the backstop.
- **Double-counting in reputation** — the single biggest correctness trap. Synthesized reverse edges and
  rolled-up sub-property edges must not be summed alongside their origins. Make "exclude inferred" the
  default in scoring aggregates.
- **Seed/ingest ordering & id↔slug mapping** — the lazy path is id-keyed and `DO NOTHING`; the seed is
  slug-keyed and `DO UPDATE`. They must reconcile on the same rows. Verify the atom-hash↔slug mapping
  exists at seed time.
- **Fixture-vs-migration drift** — confirm the live `kg.predicates`/`kg.triples` shapes before coding;
  resolve the predicate FK discrepancy (§2).
- **OWA** — contradiction and "current state" queries must read only explicit assertions.

---

## 8. Phased rollout (backend)

1. **Confirm + migrate schema.** Verify live KG shape; add `specializes_predicate_id`, `polarity`,
   `object_kind`, `market_pattern` columns, the `kg.predicate_contradictions` table, and the §5.5 indexes.
   Reconcile `is_hierarchical`/`is_social`/`is_market` with the spec (derive or drop).
2. **Build the seed.** Generate the slug-keyed `DO UPDATE` seed from `PREDICATE_SPECS`; resolve typed-key
   references in-package. Run ahead of ingestion.
3. **Query-time reads.** Ship symmetric/inverse rewrite, `specializes` roll-up expansion, and the bounded
   transitive CTE behind the API. No data migration. Measure.
4. **Materialize the hot paths** (inferred reverse edges, closure table) only where step 3 shows pressure.
5. **Consumers.** Expose predicate metadata via API; add the `polarity`/transitive/`specializes` signals to
   recommendation; wire `objectKind` validation and align `contradicts` with counter-triples.

Steps 1–3 are additive and low-risk (dormant columns, query-time reads). The schema already meeting us
halfway is the reason this is mostly *activation*, not construction.

---

## 9. Things to verify before building

1. Live `kg.predicates` / `kg.triples` migrations vs. the test fixture (esp. whether `is_symmetric` et al.
   are actually deployed).
2. The predicate FK question (`kg.triples.predicate_id` → `kg.predicates.id`?).
3. Where pre-seeded predicates (`pred_follows`, …) are currently seeded, and the atom-hash ↔ slug mapping.
4. Whether the API has committed to the KG read path (ENG-11475) before we add a predicate endpoint there
   vs. SurrealDB.
5. Recommendation-service internals (scorers/weights) — exploration findings here are unverified.
