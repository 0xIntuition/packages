# Implementation notes

This document records every known disagreement between this specification and the reference implementation ([`@0xintuition/iid`](https://www.npmjs.com/package/@0xintuition/iid)), per [§1.4](./spec/01-conformance.md). The specification states the intended rule; each note states what the code currently does. Nothing here is repaired silently — canonicalization defects, if any arise after ratification, are frozen with the scheme per [§9.3](./spec/09-registry-governance.md).

**As of specification 0.1.0 and `@0xintuition/iid` 0.1.0-alpha.0, there are no known deviations.** Every vector in [`conformance/`](./conformance/) passes against the reference implementation on Node and Bun.

## Resolved during publication

These deviations existed in the pre-publication reference implementation and were resolved in the first public release. They are recorded because pre-publication derivations may have relied on them; none affects canonicalization or any derived identifier.

### Parser accepted characters outside the value grammar

The pre-publication parser matched the value part with a catch-all pattern rather than the grammar's `%x21`–`%x7E` class ([§2.2](./spec/02-grammar.md), requirement 3), so `parseIntuitionId` and `isIntuitionId` accepted strings containing spaces or non-ASCII in the value. Full validation was unaffected — such values are never canonical, so `validateIntuitionId` already rejected them — but well-formedness reporting was looser than the grammar.

The public implementation matches the grammar exactly: the vectors `parse-009` (space in value) and `parse-010` (non-ASCII in value) are normative rejections.

**Identity impact: none.** No valid or canonical identifier is affected; only the classification of already-invalid strings changed.

## Reporting a new deviation

If a conformance vector fails against a released implementation:

1. Do not change the vector or the canonicalizer to make the failure disappear — either could silently re-derive historical identifiers.
2. Open an issue stating the vector ID, the specified behaviour, and the observed behaviour.
3. The resolution follows [§1.4](./spec/01-conformance.md): a disagreement between vector and prose is a specification defect; a disagreement between a ratified rule and the code is either a code fix (when no identifiers depend on the behaviour) or a frozen defect documented here (when they do).

## Application-local provider handles (ENG-17075)

`@0xintuition/iid-ladder` 0.1.0-alpha.1 adds an opt-in
`providerLocalHandles: 'mint'` application policy to preserve historical provider
identities from the app at `7fc0c82b4`. Its default remains `'reject'`, consistent
with §9's closed registry; this is not a deviation in `@0xintuition/iid` and does
not modify the normative specification, conformance vectors, or anchor eligibility.

Follow-up: propose admission of the ladder's `kind: 'provider-local'` mappings
(including Spotify, Goodreads, YouTube, and Steam) as Class D schemes through the
registry governance process. Preserve existing byte-exact spellings when admitted.
Until then, applications choosing `'mint'` own those unregistered identifiers.
