# Foundations: OWL/RDF Property Characteristics & 30 Years of Knowledge-Graph Research

**Status:** Reference / background
**Companion to:** `predicate-semantics.md` (the concrete design)
**Date:** 2026-06-30

This document is the intellectual grounding for the predicate-semantics design. Part I is a deep
reference on the formal property characteristics from RDF/RDFS/OWL. Part II traces the lineage of
knowledge-graph research from ~1968 to today and extracts what each era teaches us. Part III maps
that body of work directly onto the Intuition predicate fields. Part IV records the tensions the
research warns us about — the mistakes a 30-year field has already made so we don't repeat them.

---

# Part I — OWL / RDF property characteristics in depth

## I.0 Why the predicate is the unit of meaning

RDF models the world as **triples**: `⟨subject, predicate, object⟩`. The predicate (a.k.a. property)
is not decoration — it *is* the edge, and in RDF it is itself a first-class resource that can be
described, typed, and reasoned about. This is exactly Intuition's model: a predicate is an atom, and
the relationship's meaning is carried by that atom. So everything the Semantic Web learned about
"describing a property" applies to us directly.

The stack has three layers of increasing commitment:

| Layer | Year(s) | What it adds | Reasoning cost |
|---|---|---|---|
| **RDF** | 1999 / 2004 | triples, resources, literals | none (data model) |
| **RDFS** | 2004 | `subClassOf`, `subPropertyOf`, `domain`, `range` | light, tractable |
| **OWL / OWL 2** | 2004 / 2009 | property *characteristics*, disjointness, cardinality, chains | up to undecidable (OWL Full); decidable fragments (OWL DL, EL/QL/RL profiles) |

OWL is grounded in **Description Logic (DL)** — OWL DL ≈ the DL `SHOIN(D)`; OWL 2 DL ≈ `SROIQ(D)`
(Horrocks, Kutz & Sattler, 2006). DL gives every axiom a precise model-theoretic semantics and a
known complexity, which is what makes "machine-readable" actually mean "machine-*reasonable*."

## I.1 The property axioms, one by one

For each: the formal rule, what it lets a reasoner *do*, and the Intuition field it maps to.

### Object vs Datatype property → `objectKind`
OWL splits `owl:ObjectProperty` (object is a resource/node) from `owl:DatatypeProperty` (object is a
literal value). A reasoner must never traverse a datatype edge as if it were a node. This is precisely
our `objectKind: 'entity' | 'literal'` distinction (`url`, `imgUrl`, `hasDescription` are datatype-like).

### `rdfs:subPropertyOf` → `specializes`
**Rule:** `P ⊑ Q` and `P(a,b)` ⟹ `Q(a,b)`. Every specific edge entails the general one.
**Does:** roll-up. A query over `affiliatedWith` automatically catches `employedBy`, `alumniOf`,
`memberOf`. Property hierarchies are the cheapest, highest-leverage inference in the whole stack and
they descend directly from KL-ONE's structured inheritance (1985).

### `owl:inverseOf` → `ontology.inverse`
**Rule:** `P ≡ Q⁻` ⟹ `P(a,b) ↔ Q(b,a)`.
**Does:** store one direction, answer queries in both. `parentOrganization ⇄ subOrganization`,
`follow ⇄ followedBy`. Note OWL references the inverse *property*, not a display string — which is why
our design insists `inverse` be a typed `PredicateKey`.

### `owl:SymmetricProperty` → `logic.symmetric`
**Rule:** `P(a,b) ⟹ P(b,a)`. Formally, `P ≡ P⁻` (a property that is its own inverse).
**Does:** synthesize the reciprocal edge. `affiliatedWith`, `partnerOf`, `competeWith`, `sameAs`.

### `owl:AsymmetricProperty` (OWL 2) → `logic.asymmetric`
**Rule:** `P(a,b) ⟹ ¬P(b,a)`. Strictly stronger than "not symmetric."
**Does:** contradiction detection — asserting both directions is *inconsistent*. `parentOrganization`,
`betterThan`, `founder`. Asymmetry **entails irreflexivity** (see I.2).

### `owl:TransitiveProperty` → `logic.transitive`
**Rule:** `P(a,b) ∧ P(b,c) ⟹ P(a,c)`.
**Does:** reachability and closure. `containedInPlace`, `parentOrganization`, `rankedAbove`, `dependOn`.
Caveat OWL learned the hard way: combining transitivity with cardinality restrictions breaks
decidability, so OWL DL forbids it on the same property. A lesson in not stacking powers naively.

### `owl:ReflexiveProperty` / `owl:IrreflexiveProperty` (OWL 2) → `logic.reflexive` / `irreflexive`
**Rule:** reflexive ⟹ `P(a,a)` for all `a`; irreflexive ⟹ `¬P(a,a)` for all `a`.
**Does:** self-loop validation. `sameAs` is reflexive; the overwhelming majority of relationship
predicates are irreflexive (nothing is `betterThan` itself).

### `owl:FunctionalProperty` → `logic.functional`
**Rule:** `P(a,b) ∧ P(a,c) ⟹ b = c`. Each subject has at most one object.
**Does:** uniqueness validation and, under no-UNA (I.4), *identity inference* — two objects asserted
for a functional property are inferred to be the same thing. `manufacturer`, `primaryImageOfPage`.

### `owl:InverseFunctionalProperty` (IFP) → `logic.inverseFunctional`
**Rule:** `P(a,c) ∧ P(b,c) ⟹ a = b`. The object is a *key* that identifies the subject.
**Does:** entity resolution. This is how the Semantic Web does deduplication without a database join —
an IFP like `linkedAccount` says "whoever links this account is the same person." Extremely relevant
to a permissionless graph where the same entity is minted many times.

### `owl:propertyDisjointWith` (OWL 2) → `ontology.contradicts`
**Rule:** `P` disjoint `Q` ⟹ no pair `(a,b)` may satisfy both.
**Does:** consistency. `trust ⊥ distrust`, `bullishOn ⊥ bearishOn`, `support ⊥ oppose`. This is the
formal hook for Intuition's disagreement/contradiction markets.

### `owl:equivalentProperty` → `ontology.equivalentTo`
**Rule:** `P ≡ Q` ⟹ mutual sub-property; the two are interchangeable. Use for true aliases only.

### `owl:propertyChainAxiom` (OWL 2 SROIQ) → P2 / future
**Rule:** `P ∘ Q ⊑ R`, e.g. `parentOf ∘ parentOf ⊑ grandparentOf`; `locatedIn ∘ containedInPlace ⊑ locatedIn`.
**Does:** compose new edges from paths. The most powerful and most expensive axiom; SROIQ admits it only
under a *regularity* (acyclicity) restriction to stay decidable. Park it until we have a reasoning layer.

### Property restrictions / `domain` & `range`
RDFS `domain`/`range` and OWL value/cardinality restrictions type the endpoints. **We deliberately do
not duplicate these into specs** — typed targets live in `@0xintuition/classifications`. Worth knowing
the trap: in RDFS, `domain`/`range` are *axioms that entail types*, not *constraints that reject data*.
Asserting `alumniOf(x, y)` doesn't reject a non-Person `x`; it **infers** `x` is a Person. SHACL/ShEx
(2017) were later invented precisely to get *validation* (closed-world checks) back. Intuition wants
validation semantics, so this belongs in the classifications/SHACL-style layer, not OWL-style specs.

## I.2 Characteristics are not independent — the constraint lattice

A reasoner (and our `definePredicateRecord` derivation layer) must respect entailments *between*
characteristics:

- `asymmetric ⟹ irreflexive`
- `symmetric ∧ irreflexive ⟹` cannot also be asymmetric
- `reflexive ⟹ ¬irreflexive` (and a property may be neither)
- `symmetric ⟹ inverse = self`
- `transitive ⟹ inverse is transitive`; `symmetric ⟹ inverse is symmetric`
- an inverse pair must mirror each other's characteristics
- a functional + transitive property over an irreflexive domain has strong implications for chains

These are exactly the cross-checks the design assigns to the derivation/validation step. Declaring
inconsistent flags should be a build-time error, not a silent record.

## I.3 The expressivity ↔ tractability frontier (the central lesson of OWL)

OWL shipped **three species** (Lite, DL, Full) and OWL 2 added **three profiles** — not for fun, but
because the field discovered that *more reasoning power costs more compute, up to undecidable*:

| Profile | Optimized for | Drops |
|---|---|---|
| **OWL 2 EL** | huge terminologies (e.g. SNOMED医) | disjunction, inverse, cardinality |
| **OWL 2 QL** | query rewriting over databases | most existentials |
| **OWL 2 RL** | rule engines / forward-chaining at scale | some equality reasoning |

**The lesson for Intuition:** decide *how much entailment we are willing to compute at graph scale*
before we adorn predicates with axioms we can never run. A property-hierarchy + inverse + symmetry +
disjointness reasoner (essentially OWL 2 RL) is cheap, forward-chainable, and covers ~90% of our value.
Transitive closure is moderate. Property chains and full equality reasoning are where costs explode.
Our P0/P1/P2 tiers track this frontier on purpose.

## I.4 Two assumptions that change everything: OWA & no-UNA

- **Open World Assumption (OWA):** absence of a fact does *not* make it false. RDF/OWL are open-world.
  Consequence: you **cannot infer `¬trust` from the absence of a `trust` edge.** Contradiction detection
  must come from *explicit* negation or *disjointness axioms* (`contradicts`), never from missing data.
  This is why `polarity` + `contradicts` are first-class fields rather than something a query infers.
- **No Unique Name Assumption (no-UNA):** two different identifiers may denote the same entity unless
  said otherwise. This is what makes `sameAs`, functional, and inverse-functional properties powerful
  (they *infer* identity) — and dangerous (`sameAs` "smushing" can collapse the graph if mis-asserted).
  A permissionless minting model lives and dies on getting this right.

---

# Part II — Thirty years (plus) of knowledge-graph research

A compressed lineage. The throughline: the field oscillates between **expressive, hand-curated,
logically rigorous** systems and **large-scale, emergent, statistically-driven** ones — and the best
modern designs (Wikidata, Knowledge Vault) fuse both. Intuition is squarely in that fusion space.

## II.1 Pre-history: semantic networks & frames (1968–1985)
- **Semantic networks** (Quillian, 1968; Collins & Quillian) — concepts as nodes, labeled edges; the
  original "meaning as graph topology." Introduced `is-a` and property inheritance.
- **Frames** (Minsky, 1974) — structured concepts with slots and defaults; the ancestor of objects,
  classes, and schema.org "types."
- **Conceptual Graphs** (Sowa, 1976/1984) — logic-based graphs unifying semantic nets with predicate
  logic; an early, serious attempt at *machine-readable relations with formal meaning*.
- **WordNet** (Miller, Princeton, 1985–) — a lexical graph whose *relation types themselves* are the
  contribution: hypernymy/hyponymy (`is-a`, ≈ our `specializes`), meronymy (part-of, ≈ containment),
  **antonymy** (≈ our `contradicts`), troponymy. WordNet is the canonical evidence that a small,
  well-chosen set of relation *properties* captures most of lexical meaning. Directly validates our
  approach of enriching predicates with a compact, principled property set.

## II.2 The logicist peak: Description Logic & Cyc (1985–2000)
- **KL-ONE** (Brachman & Schmolze, 1985) — structured inheritance networks with formal subsumption;
  the direct ancestor of DL and thus of OWL. Gave us `subPropertyOf`/`subClassOf` with real semantics.
- **Description Logic** matures (1990s) — `ALC` and its family, tableau reasoners (FaCT, RACER, CLASSIC),
  and the systematic mapping of *which axioms cost what* (the Description Logic Handbook, Baader et al.,
  2003). This is the body of theory OWL later standardized.
- **Cyc** (Lenat, 1984–) — a decades-long bet on hand-encoding common sense. Lessons: (1) **microtheories**
  — truth is *context-scoped*, the same assertion can hold in one context and fail in another (a warning
  for any global truth graph); (2) hand-curation does not scale to the open world. Cyc's struggles are
  why the next era went statistical and emergent.

## II.3 The Semantic Web (1999–2010)
- **The vision** (Berners-Lee, Hendler & Lassila, *Scientific American*, 2001) — a web of machine-readable
  assertions. **RDF** (1999/2004), **RDFS**, then **OWL** (2004, out of the DARPA **DAML+OIL** effort,
  ~2001), **SPARQL** (2008), and **OWL 2** (2009).
- **Linked Data** (Berners-Lee, 2006) and the **Linking Open Data** project operationalized "publish
  triples, link by URI." The web-scale knowledge bases arrived: **DBpedia** (Auer et al., 2007),
  **YAGO** (Suchanek, Kasneci & Weikum, 2007), **Freebase** (Metaweb, 2007 → Google, 2010).
- **Lesson:** rich OWL reasoning rarely ran at web scale; most deployed value came from RDFS-level
  inference (hierarchies, domains) plus links. Expressivity that can't be computed is decoration.

## II.4 "Knowledge Graph" as a term, and the pragmatic turn (2010–2015)
- **schema.org** (Google/Bing/Yahoo, 2011) — a deliberately *lightweight, shared* vocabulary that won
  adoption precisely by *not* demanding heavy OWL semantics. Intuition already speaks schema.org in its
  IPFS predicate documents — a direct inheritance.
- **Google Knowledge Graph** (2012) — coined the popular term; "**things, not strings**." Built on
  Freebase. Marked the shift from ontology-first to entity-first at scale.
- **Wikidata** (Vrandečić & Krötzsch, 2012; Freebase's successor) — the most important design reference
  for Intuition. Permissionless, collaboratively edited, and it bakes in exactly the meta-machinery we're
  reaching for: **qualifiers** (context on a statement), **ranks** (preferred/normal/deprecated values),
  **references** (provenance per statement), and **property constraints** (soft validation). Wikidata is
  proof that an emergent, multi-actor graph still needs disciplined per-statement metadata to be usable.

## II.5 Statistical & learned knowledge graphs (2010–2020)
- **NELL** (Carlson & Mitchell, CMU, 2010) — never-ending extraction with *confidence scores*; knowledge
  as probabilistic, not binary.
- **Knowledge Vault** (Dong et al., Google, 2014) — fuses extractors with prior graphs under a
  probabilistic model; **provenance and confidence are first-class**. Validates Intuition's instinct to
  treat staking/attestation (signal + provenance) as core, not metadata.
- **Knowledge-graph embeddings** — and this is the striking convergence: the embedding literature
  independently rediscovered *our exact property set* as the patterns a model must capture.
  - **TransE** (Bordes et al., 2013) — relation as translation `h + r ≈ t`; natively models composition
    (transitivity) and inversion, struggles with symmetry and 1-to-many.
  - **DistMult** (Yang et al., 2015) — bilinear; models symmetry but *cannot* model antisymmetry.
  - **ComplEx** (Trouillon et al., 2016) — complex embeddings specifically to capture **antisymmetry**.
  - **RotatE** (Sun et al., 2019) — relation as rotation in complex space; its headline claim is that a
    good representation must capture **symmetry, antisymmetry, inversion, and composition** — i.e.
    `symmetric`, `asymmetric`, `inverse`, `transitive`. When a hand-built logic (OWL) and a learned
    geometry (RotatE) converge on the *same four relational properties*, that set is not arbitrary — it
    is the load-bearing core. Our `logic` facet is exactly these four plus cardinality.
  - **R-GCN** (Schlichtkrull et al., 2018) — relational graph neural nets for link prediction.

## II.6 Time, provenance, and statements-about-statements (the reification thread)
This thread is where Intuition's model is most distinctive, so it matters most.
- **States vs events** is old AI: situation calculus (McCarthy & Hayes, 1969) and event calculus
  (Kowalski & Sergot, 1986) distinguish **fluents** (things that hold over intervals and can change)
  from **events** (instantaneous). This is precisely our `temporalNature: state | event | permanent`.
- **Temporal RDF** (Gutierrez, Hurtado & Vaisman, 2007) and temporal KG embeddings added valid-time to
  triples. The lesson: a `state` edge without a validity interval silently rots.
- **PROV-O** (W3C, 2013) standardized provenance (entities, activities, agents) — the vocabulary for
  "who asserted this, derived from what."
- **Reification — how to say something about a statement** — is the field's longest-running headache,
  and Intuition's triples-as-atoms model *is* a reification design. The options the field tried:
  1. **RDF standard reification** (1999) — a 4-triple `rdf:Statement` blob; verbose, semantically weak.
  2. **N-ary relations** — introduce an intermediary node for the relationship.
  3. **Named graphs / quads** — attach context to whole graphs.
  4. **Singleton properties** (Nguyen, Bodenreider & Sheth, 2014) — mint a unique sub-property per
     statement; strikingly close to Intuition giving each predicate/edge an atom identity.
  5. **RDF-star / SPARQL-star** (Hartig, ~2014, standardized later) — first-class edge annotations; the
     modern answer and the closest analog to a property-graph with per-edge metadata.
- Our `objectKind: 'claim'` (for `disputedBy`, `confirmedBy`, `attestedBy`, `citedBy`, `evidencedBy`) is
  exactly this: predicates whose object is *another statement*. Naming it makes Intuition's reification
  explicit and traversable instead of implicit.

## II.7 Signed & trust networks (the social-graph thread Intuition actually lives in)
Classical KGs modeled *facts*; Intuition models *trust and opinion*, so the relevant theory is signed
social networks, which classical OWL says nothing about:
- **Structural balance theory** (Heider, 1946; formalized by Cartwright & Harary, 1956) — "the friend of
  my friend is my friend; the enemy of my enemy is my friend." The original math of **signed** (positive/
  negative) edges. This is the academic backbone of our `polarity` field in a trust graph.
- **Status theory & signed-edge prediction** (Leskovec, Huttenlocher & Kleinberg, 2010, *Signed Networks
  in Social Media*) — trust/distrust edges (Epinions, Slashdot) obey balance *and* status dynamics, and
  signs are predictable from local structure. Direct grounding for treating `trust`/`distrust`,
  `endorse`/`oppose`, `bullishOn`/`bearishOn` as signed and mutually constraining.
- **Subjective Logic** (Jøsang, ~2001) — an algebra of opinions with explicit *uncertainty*, built for
  trust propagation. Relevant if Intuition ever wants to propagate/compose trust quantitatively, and a
  pointer for a future `intensity`/confidence dimension.
- **Property-graph model & Cypher** (Neo4j) — the industrial counter-tradition to RDF: edges carry
  arbitrary key/value properties natively (no reification needed). Intuition's per-edge economics make it
  closer to a property graph than to classic RDF, which is worth keeping in mind when we choose how much
  to serialize on-chain vs. compute off-graph.

## II.8 OntoClean — meta-properties to discipline an ontology (the closest precedent to this work)
**OntoClean** (Guarino & Welty, 2000–2002) deserves its own note because it is *the* precedent for what
we are doing: tagging relations/types with **meta-properties** to keep an ontology honest. Its tags:
- **Rigidity** — is a property essential (`+R`, true of an instance in every world: *being a person*) or
  a temporary role (`~R`/`-R`: *being a student/employee*)? This is almost exactly our `temporalNature`
  `permanent` vs `state` distinction, arrived at from a different direction.
- **Identity** — does the property carry a criterion for telling two instances apart? (cf. our IFP/keys.)
- **Unity** and **Dependence** — is the entity a whole, and does it depend on another? (cf. relational
  vs intrinsic predicates.)
OntoClean's whole thesis — *a small set of philosophical meta-properties dramatically improves an
ontology's quality and catches modeling errors* — is the precedent that says enriching predicates with
`polarity`/`claimType`/`temporalNature`/`logic` is not gold-plating; it is the known path to a clean graph.

---

# Part III — Mapping the research onto Intuition's fields

| Field (from `predicate-semantics.md`) | Primary lineage | One-line takeaway |
|---|---|---|
| `logic.symmetric / asymmetric / transitive` | OWL property characteristics; RotatE/ComplEx | The empirically-confirmed load-bearing core — both logic and ML converge here. |
| `logic.reflexive / irreflexive` | OWL 2 | Self-loop validity; respect the constraint lattice (asymmetric ⟹ irreflexive). |
| `logic.functional / inverseFunctional` | OWL; entity resolution | IFPs are *keys* — the Semantic Web's dedup mechanism, vital for permissionless minting. |
| `ontology.inverse` | `owl:inverseOf` | Typed property ref, not a string; store one direction. |
| `ontology.specializes` | RDFS `subPropertyOf`; KL-ONE; WordNet hypernymy | Cheapest high-value inference: roll-up. |
| `ontology.contradicts` | OWL 2 `propertyDisjointWith`; WordNet antonymy; balance theory | The formal hook for disagreement markets; required because OWA forbids inferring negation from absence. |
| `ontology.equivalentTo` | `owl:equivalentProperty` | Aliases only; beware no-UNA "smushing." |
| `polarity` | Signed networks (Heider; Leskovec et al.) | Classical KGs lacked this; a *trust* graph cannot. |
| `claimType` (factual/evaluative/normative) | fact/value distinction; Cyc microtheories; subjective logic | A market over a fact ≠ a market over an opinion. |
| `verifiability` | Knowledge Vault; PROV-O; Wikidata references | Provenance/confidence as first-class, validating staking-as-signal. |
| `temporalNature` | situation/event calculus; temporal RDF; OntoClean rigidity | Distinguishes edges that rot from edges that are permanent. |
| `objectKind` (entity/claim/literal) | Object vs datatype properties; reification thread (singleton properties, RDF-star) | Makes Intuition's triples-as-atoms reification explicit and traversable. |
| `marketPattern` | Intuition-native (no classical analog) | The economic layer the prior 30 years never had. |

---

# Part IV — What the research warns us about

1. **Don't out-reason your compute (the OWL species lesson).** Pick a target profile. OWL 2 RL —
   property hierarchy + inverse + symmetry + transitivity + disjointness, all forward-chainable — buys
   ~90% of the value cheaply. Treat property chains and full equality reasoning as opt-in P2.

2. **Open World means contradictions need explicit axioms.** You can never conclude `¬trust` from a
   missing edge. `polarity` and `contradicts` must be declared, not inferred from absence. Bake this into
   how the disagreement/market logic reads the graph.

3. **No Unique Names makes `sameAs`/functional/IFP both powerful and dangerous.** Identity inference can
   collapse distinct entities ("smushing") if mis-asserted. Gate equivalence and key-like predicates
   carefully — in a permissionless system this is a primary attack surface.

4. **Emergent graphs still need per-statement discipline (the Wikidata lesson).** Wikidata is
   permissionless *and* rigorous because every statement can carry qualifiers, rank, and references.
   Intuition's staking is the analog of references; we should make sure `temporalNature`/`claimType`
   give authors the same per-edge expressiveness Wikidata found indispensable.

5. **Validation ≠ entailment (the SHACL lesson).** OWL `domain`/`range` *infer* types; they don't reject
   bad data. Since Intuition wants to *reject* malformed edges, typing/validation belongs in the
   classifications/SHACL-style layer — which is exactly where the design leaves it. Don't accidentally
   re-import OWL's inferential domain/range semantics into a validation context.

6. **Truth can be context-scoped (the Cyc microtheory lesson).** A predicate's assertion may be true in
   one context and not another. We're not adding context-scoping now, but the design should not assume
   global, timeless truth so hard that adding context later requires a rewrite.

---

## Selected references

- Quillian (1968) *Semantic Memory*; Minsky (1974) *A Framework for Representing Knowledge*; Sowa (1984) *Conceptual Structures*.
- Brachman & Schmolze (1985) *KL-ONE*; Baader et al. (2003) *The Description Logic Handbook*.
- Miller (1995) *WordNet*; Lenat (1995) *Cyc*.
- Berners-Lee, Hendler & Lassila (2001) *The Semantic Web*; W3C RDF (2004), RDFS (2004), OWL (2004), OWL 2 (2009); Horrocks, Kutz & Sattler (2006) *SROIQ*.
- Guarino & Welty (2002) *OntoClean*.
- Auer et al. (2007) *DBpedia*; Suchanek et al. (2007) *YAGO*; Vrandečić & Krötzsch (2014) *Wikidata*.
- Carlson et al. (2010) *NELL*; Dong et al. (2014) *Knowledge Vault*.
- Bordes et al. (2013) *TransE*; Yang et al. (2015) *DistMult*; Trouillon et al. (2016) *ComplEx*; Sun et al. (2019) *RotatE*; Schlichtkrull et al. (2018) *R-GCN*.
- McCarthy & Hayes (1969) *Situation Calculus*; Kowalski & Sergot (1986) *Event Calculus*; Gutierrez et al. (2007) *Temporal RDF*; W3C PROV-O (2013).
- Heider (1946); Cartwright & Harary (1956) *Structural Balance*; Leskovec, Huttenlocher & Kleinberg (2010) *Signed Networks in Social Media*; Jøsang (2001) *Subjective Logic*.
- Nguyen, Bodenreider & Sheth (2014) *Singleton Property*; Hartig (2017) *RDF-star*.
