# `specializes`

**Type:** `PredicateKey` (this predicate is a sub-property of the referenced one)
**Confidence: 80 / 100 — Ship.**

> Verdict: the cheapest high-leverage inference in the whole stack — roll-up. A specific edge entails the
> general one, so broad queries and reputation catch every specific sub-relation for free. Descends from
> RDFS `subPropertyOf` and KL-ONE inheritance (1985); echoed by WordNet hypernymy.

## The problem it solves

Specific relationships imply broader ones. `specializes` declares the hierarchy so consumers query/score
at the general level and automatically include the specifics:

- `employedBy`, `alumniOf`, `memberOf`, `founder` → all `specializes` `affiliatedWith`
- `endorse`, `vouchFor` → `specializes` `support` (or a general positive-regard predicate)
- `subOrganization`, `branchOf` → `specializes` a general containment relation
- `authoredBy`, `createdBy`, `director`, `producer` → `specializes` `contributedTo`

## Examples across the value axes

1. **[QUERY] Roll-up without enumeration.** "Everyone affiliated with Acme" returns employees, alumni, and
   members in one query, because each specific predicate `specializes affiliatedWith`. The query author
   writes one predicate; the indexer expands the hierarchy. Without it, the query must hand-list every
   sub-predicate and silently miss any added later.

2. **[ECON] Reputation at the right granularity.** A "general affiliation" reputation signal aggregates all
   sub-relations; a "contribution" score sums `authoredBy` + `createdBy` + `contributedTo`. The scoring
   engine walks `specializes` instead of maintaining its own grouping table.

3. **[RENDER] Faceted, grouped UI.** A profile groups edges under collapsible headings ("Affiliations →
   employed by, alumnus of, member of") generated from the predicate hierarchy. New sub-predicates appear
   under the right heading automatically.

4. **[MACHINE] Forward-chainable entailment.** `P specializes Q` and `P(a,b)` ⟹ `Q(a,b)` is pure OWL 2 RL —
   cheap, monotonic, computable at graph scale. It's the highest value-per-compute axiom we have.

## What breaks without it

Every "broad" query and every reputation grouping hardcodes the list of sub-predicates, and those lists
rot the moment a new predicate is added. The graph can't answer general questions without enumerating
specifics — defeating much of the point of a semantic layer.

## Cost / complexity

Moderate authoring — it needs **human curation** to define the hierarchy correctly (and to avoid asserting
false generalizations). Cheap to consume. The hierarchy is shallow (1–2 levels) for most predicates.

## Pruning check

- *Derivable?* No — the hierarchy is editorial/semantic.
- *Duplicated?* Distinct from `category` (which is a flat classification bucket for discovery, not an
  entailment relation). `category` groups for *browsing*; `specializes` groups for *inference*. Worth
  stating explicitly so the two don't get conflated.
- *Mergeable?* No — `category` can't carry entailment.

## Confidence breakdown

Leverage 35/40 · Consumer readiness 18/25 · Simplicity 15/20 · Non-redundancy 12/15 → **80**.
(Deductions: curation cost and a roll-up-query consumer that's emerging rather than fully built. The
inference is so cheap and so central that it stays a clear ship.)
