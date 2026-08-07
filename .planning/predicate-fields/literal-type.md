# `literalType`

**Type:** `'url' | 'image' | 'date' | 'number' | 'text'` — only meaningful when `objectKind === 'literal'`
**Confidence: 85 / 100 — Ship.** *(Added by the audit pass, `predicate-spec-audit.md` A3.)*

> Verdict: the missing half of the rendering contract. `objectKind: 'literal'` says the object is a value,
> but not *what kind* — and the literal subset is exactly where rendering varies most. RDF solved this with
> typed literals (`xsd:anyURI`, `xsd:date`, …); this is our pragmatic equivalent.

## The problem it solves

`objectKind`'s flagship promise is "the frontend renders any edge with zero per-predicate code." But its
own example betrays a gap: *"render `imgUrl` as an `<img>`, `url` as an `<a>`"* — that switch is back on
the **predicate key**. Knowing "it's a literal" doesn't distinguish image / link / date / number / prose.
Without a datatype, the per-predicate `switch` the field set promises to delete survives for literals:

- `imgUrl` → `image` → `<img>`
- `url`, `hasSource` → `url` → `<a>`
- `foundedOn`, `releaseDate` → `date` → formatted date, locale-aware
- `employeeCount`, `price` → `number` → formatted numeral
- `hasDescription`, `bio` → `text` → prose block

## Examples across the value axes

1. **[RENDER] Completes the generic `<EdgeObject>` component.** The `literal` branch switches on
   `literalType` instead of predicate key. New literal predicates render correctly with zero frontend
   changes — the actual promise of the rendering contract, now kept for the hardest subset.

2. **[DATA] Value validation at write time.** `literalType: 'url'` ⟹ validate URL shape;
   `'date'` ⟹ parseable date; `'number'` ⟹ numeric. Catchable at authoring/API time the moment the field
   exists — no engine needed, it's a format check, not inference.

3. **[MACHINE] Serializes to standard XSD datatypes.** `url → xsd:anyURI`, `date → xsd:date`,
   `number → xsd:decimal` — third parties get typed literals exactly as RDF defines them.

4. **[QUERY] Typed filtering/sorting.** "Sort by release date," "filter numeric ranges" require the indexer
   to know which literal edges are dates/numbers before it can index them as such.

## Why not lean on `classifications` / schema.org property types instead?

That re-introduces a cross-package lookup in the hot rendering path — the coupling the rendering-contract
argument was built to avoid. The literal predicate set is small; the annotation is mechanical.

## Cost / complexity

Trivial. Only populated on literal predicates (a small set), values are obvious, validated by rule 12
(`literalType` present ⟹ `objectKind === 'literal'`) in `definePredicateRecord`.

## Pruning check

- *Derivable?* Sometimes sniffable from stored values, but that's runtime guessing — the point is a
  declared contract. Not derivable from other spec fields.
- *Duplicated?* No. `objectKind` is the coarse axis; this refines exactly one of its values.
- *Mergeable?* Could be folded into `objectKind` as a 7-value enum (`entity | claim | url | image | …`),
  but that muddles the coarse entity/claim/literal distinction consumers branch on first. Two fields, one
  subordinate, is cleaner.

## Confidence breakdown

Leverage 34/40 · Consumer readiness 23/25 · Simplicity 19/20 · Non-redundancy 9/15 → **85**.
(Deduction: partial overlap with what value-sniffing or schema.org types could approximate; the declared
contract still wins for the hot path.)
