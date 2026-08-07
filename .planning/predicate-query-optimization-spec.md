# Spec: Predicate-Aware Query Optimization for Metadata & Identity Traversal

**Status:** Technical spec — draft for review
**Companion to:** `predicate-backend-implementation-plan.md`, `predicate-backend-integration.md`
**Backend verified:** `alpha/backend` + `@0xintuition/database-kg` (Drizzle), 2026-07-01
**Focus:** indexing the KG DB, parsing predicates, and enabling connected-triple lookups from a root item

---

## 1. The problem, concretely

**Scenario (real — it exists today as `workers/scripts/run-kg-spotify-smoke.ts`):** a song atom is created
from a Spotify link. Its `data_resolved` is schema.org JSON-LD:

```json
{ "@type": "MusicRecording", "name": "Man I Need", "byArtist": "Olivia Dean",
  "sameAs": ["https://open.spotify.com/track/1qbmS6ep2hbBRaEZFpn7BX"] }
```

Later, someone connects an Apple Music link so users know it's the same song — **via a URL predicate edge**
`(song, url, appleMusicAtom)`. Now "everything we know about this song" is spread across:

- the node's **own embedded metadata** (`data_resolved`: name, artist, Spotify url), and
- **connected triple edges** (the new Apple Music url; tags; listed-in; reviews; …), and
- possibly **co-referent nodes** declared equivalent (`sameAs`).

### The architectural shift this forces

| | Today | Target |
|---|---|---|
| Metadata (url, image, artist) | embedded in `data_resolved` JSONB | **also** first-class triple **edges** |
| Identity (`sameAs`) | a string array inside `data_resolved`; `canonical_url` denormalized onto `search.documents` | **edges** + a resolved **equivalence class** |
| "Find X about this item" | JSON extract (`data_resolved->>'url'`) / exact `canonical_url` match | **traverse connected triples**, predicate-aware |

The current JSON approach is fast for the single node but **cannot answer graph questions** — "all URLs for
this song across platforms," "everything anyone has asserted about it," "what is this the same as." Moving
to triple-native traversal is what unlocks that; this spec makes it performant. A complete answer must
**union embedded metadata + edges, across the equivalence class**.

---

## 2. Query taxonomy (the read patterns to optimize)

All over `kg.triples` (subject_id, subject_type, predicate_id, object_id, object_type, status, visibility,
confidence, inferred, metadata) joined to `kg.predicates` and `kg.nodes`.

| # | Pattern | Shape | Notes |
|---|---|---|---|
| Q1 | **Direct attributes** | `subject_id = R` | outgoing edges of root |
| Q2 | **Incoming edges** | `object_id = R` | who references root |
| Q3 | **Typed multi-value** | `subject_id = R AND predicate_id = url` | *the Spotify+Apple case — two url edges on one node* |
| Q4 | **Identity/co-reference** | closure over `sameAs` (± inverse-functional keys) | the equivalence class of R |
| Q5 | **Cross-class metadata gather** | Q1/Q3 over **all class members** | "everything about this song" |
| Q6 | **Roll-up / reverse / transitive** | expand `specializes`; add `inverse`/`isSymmetric`; `isTransitive` closure | predicate-metadata-driven |

Q3 is the common, cheap case (multi-valued attribute on one node). Q4/Q5 are the hard, general case
(co-reference). We optimize both, but they need different machinery.

---

## 3. Parsing predicates → the in-memory predicate registry

"Properly index and parse predicates" = load `kg.predicates` (seeded from the package, per the
implementation plan) into a **typed registry keyed by predicate atom id**, built once at startup and
refreshed on seed change. `kg.predicates` is tiny (hundreds of rows), read on every traversal → cache it;
never join it per-query on the hot path.

The registry classifies each predicate into **roles** derived from our fields:

```ts
interface PredicateRole {
  id: string; slug: string;
  objectKind: 'entity' | 'claim' | 'literal';   // how to handle the object during gather
  isMetadataLiteral: boolean;                    // objectKind === 'literal' → collect value
  literalType?: 'url'|'image'|'date'|'number'|'text';  // audit A3 — how to resolve/render the value
  isEquivalence: boolean;                        // EXPLICIT allow-list (sameAs) — see note below
  isIdentityKey: boolean;                        // isInverseFunctional → shared object ⇒ same subject
  isSymmetric: boolean;
  isTransitive: boolean;
  inverseId?: string;                            // reverse-direction predicate
  isCanonicalDirection: boolean;                 // audit A1 — inverse pairs normalize to one direction
  specializesIds: string[];                      // parent predicates (roll-up) — array/DAG per audit B1
  polarity?: 'positive'|'negative'|'neutral';
  temporalNature?: 'permanent'|'state'|'event';
}
```

Fast lookup structures the query builder consults:

- `HashMap<id, PredicateRole>` — the registry.
- `HashSet<id>` per role: `EQUIVALENCE_PREDS`, `IDENTITY_KEY_PREDS`, `METADATA_LITERAL_PREDS`,
  `SYMMETRIC_PREDS`.
- `HashMap<id, Set<id>>` `SPECIALIZES_CHILDREN` (parent → descendants) for roll-up expansion.
- `HashMap<id, id>` `INVERSE_OF`.

This registry is the "parsed predicate" layer. Everything downstream (gather, equivalence, rewrite) is a
function of it — so adding a predicate or changing a field is a data change, not a code change.

> **Guardrail (audit C2): `isEquivalence` is an explicit allow-list, never inferred from algebra.**
> `isSymmetric + isTransitive` mathematically characterizes an equivalence-like relation, and it's
> tempting to let any such predicate trigger identity behavior. Don't: identity merge is the
> highest-blast-radius inference in the system (no-UNA "smushing" — one bad edge merges two entities'
> metadata, stake context, and reputation), and inferring the behavior from two booleans means a future
> author can create it *by accident*. Equivalence-class membership is opt-in by predicate key — today
> **`sameAs` only** (`equivalentTo` was cut from the spec). The symmetric+transitive combination on any
> other predicate is a build-time lint (decision record §5.1 rule 9).

> **Atom parsing note:** the atom parse/enrich workers (`kg-parse-worker`, `kg-enrichment-worker`) that
> populate `data_resolved` should *also* be able to **emit edges from JSON-LD properties** (`url`, `sameAs`,
> `byArtist`) so embedded metadata becomes queryable triples. That's the ingestion half of the shift in §1;
> this spec assumes it and focuses on read/index.

---

## 4. Indexing `kg.triples` (the core of "update our indexing database")

Today `kg.triples` has only PK + the predicate FK → every traversal is a seq scan. Required indexes,
tuned to §2 and designed for **index-only scans** (INCLUDE the columns the gather needs so Postgres skips
the heap):

```sql
-- Q1, Q3, Q5 forward: attributes of a node/class
CREATE INDEX ix_triples_subject ON kg.triples
  (subject_id, predicate_id) INCLUDE (object_id, object_type, confidence)
  WHERE status = 'active' AND inferred = false;

-- Q2 reverse + symmetric/inverse views
CREATE INDEX ix_triples_object ON kg.triples
  (object_id, predicate_id) INCLUDE (subject_id, subject_type)
  WHERE status = 'active' AND inferred = false;

-- Q6 roll-up IN-scans / per-predicate analytics
CREATE INDEX ix_triples_predicate ON kg.triples (predicate_id, subject_id);

-- Identity-key lookup ("which subjects share this url object?") — Q4 via IFP
CREATE INDEX ix_triples_object_predicate ON kg.triples
  (object_id, predicate_id) INCLUDE (subject_id)
  WHERE status = 'active';   -- (broader than base view; identity spans states)

-- Equivalence edges: small, hot, stable predicate set
CREATE INDEX ix_triples_equivalence ON kg.triples (subject_id, object_id)
  WHERE predicate_id = ANY (<equivalence predicate ids>) AND status = 'active';
```

Design rationale:

- **Partial `WHERE status='active' AND inferred=false`** keeps the base-view indexes small and makes
  "exclude synthesized/rolled-up edges" the default (no double-counting).
- **`INCLUDE` covering columns** → index-only scans for gather; the object value fetch is a separate
  batched `kg.nodes` lookup (§6), not a per-row heap hit.
- The **equivalence partial index** is pinned to the known equivalence predicate ids from the seed, so
  `sameAs` traversal never scans unrelated edges.
- Reassess after load: for very hot single predicates (`url`, `hasTag`) a dedicated partial index per
  predicate id can beat the shared one.

Also index the **object value path** used for URL identity on `kg.nodes`:
```sql
CREATE INDEX ix_nodes_url ON kg.nodes ((data_resolved->>'url'));       -- existing JSON path lookups
CREATE INDEX ix_nodes_search_text ON kg.nodes USING gin (to_tsvector('simple', search_text));
```

---

## 5. Identity / co-reference resolution engine (Q4/Q5)

The equivalence class of a node is the connected component under **equivalence predicates** (the explicit
allow-list from §3 — today `sameAs` only) plus **identity keys** (any predicate flagged
`isInverseFunctional`: two subjects with the same object are the same entity).

> In the Spotify+Apple example the two URLs *differ*, so the IFP-on-url rule does **not** auto-merge them —
> that case is either a **multi-valued attribute** on one node (Q3, cheap) or an **explicit `sameAs`** edge
> between two representation nodes (Q4). IFP auto-merge fires when two nodes genuinely share one url object.

Two implementations:

### 5A. Query-time (recursive CTE) — good for small classes, zero maintenance
```sql
WITH RECURSIVE class AS (
  SELECT $1::text AS node_id
  UNION
  SELECT CASE WHEN t.subject_id = c.node_id THEN t.object_id ELSE t.subject_id END
  FROM class c
  JOIN kg.triples t
    ON (t.subject_id = c.node_id OR t.object_id = c.node_id)
   AND t.predicate_id = ANY (<equivalence predicate ids>)
   AND t.status = 'active'
) SELECT node_id FROM class;   -- UNION dedups / terminates cycles
```
Cost grows with class size and is paid on **every read**. Fine at low scale.

### 5B. Materialized canonical id (recommended) — O(1) class lookup, incremental maintenance
New read model + projector:
```sql
CREATE TABLE kg.node_equivalence (
  node_id       text PRIMARY KEY,
  canonical_id  text NOT NULL,
  class_version bigint NOT NULL DEFAULT 0
);
CREATE INDEX ix_node_equiv_canonical ON kg.node_equivalence (canonical_id);
```
- A new **`EquivalenceProjection`** (indexing-services, alongside `core_entities`) runs a **union-find**:
  on each `sameAs`/`equivalentTo` triple (and each IFP-key collision), `union(a, b)`; the canonical id is
  deterministic (e.g. lowest atom id, or the earliest-created node) so results are stable and replay-safe.
- Class lookup = `SELECT canonical_id FROM kg.node_equivalence WHERE node_id = $1` then all members via the
  `canonical_id` index. No recursion on read.
- **Merges:** joining two classes re-points the smaller class's members (path-compression); bump
  `class_version` to invalidate caches (§7).
- **Splits (retraction):** redacting a `sameAs` can split a component — expensive and rare. Handle by
  marking the class dirty and recomputing that component (bounded BFS), not the whole table.

**Recommendation:** ship **5A first** (no migration, correct), add **5B** once class reads are hot or
classes grow. Same interface (`equivalenceClass(nodeId) → id[]`) so the query builder doesn't change.

---

## 6. Predicate-aware metadata gather (Q5) — the algorithm

```
gatherMetadata(rootId, { hops = 1, includeInferred = false }):
  classIds = equivalenceClass(rootId)                 // §5 (5A or 5B)

  edges = SELECT subject_id, predicate_id, object_id, object_type, confidence
          FROM kg.triples
          WHERE subject_id = ANY(classIds)
            AND status='active' AND visibility='public'
            AND (includeInferred OR inferred=false)     // uses ix_triples_subject

  result = {}                                          // slug -> value[]
  objectIds = []
  for e in edges:
     role = registry[e.predicate_id]                   // §3, no DB hit
     switch role.objectKind:
       'literal': objectIds.push(e.object_id)          // resolve value in batch below
                  result[role.slug] += { ref: e.object_id, kind:'literal' }
       'entity' : result[role.slug] += { ref: e.object_id, kind:'entity' }   // recurse if hops>1
       'claim'  : result[role.slug] += { ref: e.object_id, kind:'claim' }

  // one batched fetch — avoids N+1
  values = SELECT id, data_resolved, classification_type
           FROM kg.nodes WHERE id = ANY(objectIds)
  splice resolved values into result[*].kind=='literal'

  // merge each class member's OWN embedded data_resolved (§1 completeness)
  embedded = SELECT id, data_resolved FROM kg.nodes WHERE id = ANY(classIds)
  merge embedded JSON-LD (url, sameAs, byArtist, …) into result, deduped

  // optional Q6: reverse/inverse edges, roll-up expansion (registry-driven)
  return result
```

Key properties: **two batched queries** (edges by class; object values) + one embedded-data fetch — no
per-edge round trips; predicate handling comes from the in-memory registry, not joins; inferred excluded by
default so nothing is double-counted; embedded JSON-LD and edges are unioned for completeness.

---

## 7. Read model, caching, guardrails

- **Optional metadata projection** `kg.node_metadata(canonical_id PK, resolved jsonb, class_version)` —
  precomputes §6 output per class for "give me the card for this item" in one read. Rebuilt by a projector
  on relevant writes. Trade write cost for read latency; add only when gather is measured hot.
- **Cache** `canonical_id → resolved` in the read service, keyed by `class_version`; a class merge/edge
  write bumps the version → natural invalidation.
- **Guardrails:**
  - **Class-size cap** (e.g. 10k members) with logged truncation — a bad `sameAs` chain shouldn't fan out
    unbounded. Never silently truncate without a signal.
  - **Cycle-safe** equivalence (UNION / visited set).
  - **Depth cap** on entity recursion (`hops`) and on transitive closure (§ integration doc, ~8).
  - **OWA**: gather reads only explicit, active assertions.

---

## 8. Pipeline & code changes

| Area | Change | Where |
|---|---|---|
| Schema | §4 indexes; `kg.node_equivalence` (5B); optional `kg.node_metadata` | KG migrations (per impl-plan P0) |
| Predicate registry | load seed → in-memory role registry + lookup sets; refresh on change | KG read layer (`@0xintuition/database-kg`) + recommendation-service |
| Atom parse | emit edges from JSON-LD props (`url`, `sameAs`, `byArtist`) so embedded metadata becomes triples | `kg-parse-worker` / enrichment workers |
| Equivalence | `EquivalenceProjection` (union-find → `kg.node_equivalence`) | `indexing-services/crates/projections` |
| Metadata | (optional) `MetadataProjection` → `kg.node_metadata` | same |
| Query builder | `equivalenceClass()`, `gatherMetadata()`, roll-up/inverse rewrite — Drizzle | `@0xintuition/database-kg/actions` |
| API | expose gather + typed-neighbor endpoints; `includeInferred` toggle | `api/src/clients/kg-*.ts`, routes |

All projectors idempotent + replay-safe (`ON CONFLICT`), matching the existing `core_entities` pattern, and
graceful no-op when `DATABASE_KG_URL` is absent.

---

## 9. Performance expectations

| Query | Without spec | With spec |
|---|---|---|
| Q1/Q3 attributes | seq scan O(triples) | index-only scan O(deg(node)) via `ix_triples_subject` |
| Q2 incoming | seq scan | `ix_triples_object` |
| Q4 class | recursive seq scans | 5A bounded CTE on `ix_triples_equivalence`; 5B O(1) lookup |
| Q5 gather | N+1 explosion | 2 batched index scans + registry (no per-edge joins) |
| Q6 roll-up | enumerate sub-preds by hand | registry expansion → single `predicate_id = ANY(...)` on `ix_triples_predicate` |

Target: single-item metadata card in **one or two index-only scans + one batched node fetch**, independent
of total graph size; class resolution O(1) under 5B.

---

## 10. Deliverables & acceptance criteria

1. **Indexes (§4)** applied; `EXPLAIN` shows index-only scans for Q1–Q3, no seq scan on `kg.triples`.
2. **Predicate registry (§3)** loaded from seed; role lookups are in-memory (0 DB hits on the hot path).
3. **Equivalence (§5)** — `equivalenceClass(spotifySong)` returns the Apple Music co-referent(s); correct
   under cycles; stable canonical id.
4. **Gather (§6)** — `gatherMetadata(song)` returns *both* platform URLs and unions embedded + edge
   metadata in ≤ 2 batched queries; excludes inferred by default; no double-count.
5. **Guardrails (§7)** — class-size cap logs truncation; caches invalidate on `class_version` bump.
6. **Bench** — p95 for the single-item card under target on a graph ≥ 10× current size.
7. Reuse/extend the **Spotify smoke test** as the end-to-end fixture.

---

## 11. Open questions

1. Do we **migrate** embedded `data_resolved` metadata (url/sameAs) into edges, or keep both and union at
   read (§6)? (Union-at-read is lower-risk; edge emission can backfill over time.)
2. Which predicates are **identity keys** (`isInverseFunctional`)? `url` per-platform is *not* globally
   unique (same song, many urls) — so IFP likely applies to canonical/isrc-style ids, not raw platform urls.
   This decides how much auto-merge is safe (smushing risk).
3. Materialize now (5B / `kg.node_metadata`) or start query-time (5A) and promote on measured pressure?
4. Retraction/split policy for `sameAs` — recompute-on-dirty vs periodic full rebuild.
5. Does gather cross **visibility/creator** boundaries, or only the requester's trusted set? (Affects
   whether class expansion is global or scoped.)
