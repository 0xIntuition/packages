# `orcid` — Open Researcher and Contributor ID

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline check-digit validation |
| Scheme typing | polymorphic (kept symmetric with `isni`, whose format and range it shares) |
| Authority | ORCID, Inc. |
| Canonical form | 16 characters, no separators: 15 digits + ISO 7064 mod 11-2 check character (`0`–`9` or `X`) |

## What it identifies

An ORCID iD identifies a **researcher** — a person who registers with ORCID, Inc. to disambiguate their scholarly output. ORCID iDs are issued from a block reserved inside the ISNI namespace and use the same 16-character format and the same ISO 7064 mod 11-2 check algorithm; the two schemes share one canonicalizer.

Although every ORCID holder is a person, the scheme is typed **polymorphic**, deliberately mirroring [`isni`](./isni.md). The value formats are indistinguishable, and the canonicalizer does not verify range membership — so nothing in a canonical `orcid` value structurally guarantees a person rather than any ISNI-shaped party. Typing the schemes asymmetrically would make the anchor-eligibility of a 16-digit string depend on which scheme label it happened to arrive under, which is exactly the kind of ambiguity scheme typing exists to prevent.

## Value grammar

```regex
^\d{15}[\dX]$
```

with the additional constraint that the final character is the correct ISO 7064 mod 11-2 check character over the first 15 digits. The grammar alone is not sufficient — a conforming validator recomputes the check character.

## Canonicalization

Identical to `isni` — the schemes share one canonicalizer.

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`). The familiar hyphenated display form `0000-0002-1825-0097` carries no identity in its hyphens.
2. **Uppercase** the result, folding a lowercase `x` check character.
3. **Match the shape** `^\d{15}[\dX]$`. Anything else is **rejected** (return undefined).
4. **Verify the check character** per ISO 7064 mod 11-2 over the first 15 digits:

   ```text
   total = 0
   for each digit d:  total = (total + d) × 2
   remainder = total mod 11
   check     = (12 − remainder) mod 11     ; 10 renders as X
   ```

   The value is valid iff `check` equals the sixteenth character. A mismatch is a **rejection**, never a repair.

## Validation

A conforming validator accepts exactly the canonical form: 16 characters, separator-free, check character verified. The hyphenated form that ORCID itself displays — and embeds in `https://orcid.org/…` URLs — is input to canonicalization, never a valid IID value.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `0000-0002-1825-0097` | `0000000218250097` | hyphenated ORCID strips separators |
| `0000000218250097` | `0000000218250097` | canonical ORCID is idempotent |
| `0000-0002-1825-0098` | ✗ reject | check character fails |

## Notes and limitations

- **Polymorphism floors this scheme at P1.** An `orcid` IID is never P0-anchor-eligible; the entity's `@type` must live in the payload, per [§7](../spec/07-representation-profiles.md). This holds even though ORCID's registrants are in practice all persons — the floor is a property of what the *value* can prove, not of registry policy.
- **Range membership is not verified.** The canonicalizer accepts any check-valid 16-character value; it does not confirm the digits fall within ORCID's reserved ISNI block. A valid ISNI outside that block will canonicalize under `orcid`. Keeping such values out is a data-quality concern upstream of canonicalization.
- **The check character catches transcription errors, not lies.** It proves the string is internally consistent, not that ORCID, Inc. ever issued it.
- **Same digits, two schemes.** A researcher who also holds their ORCID as an ISNI record yields byte-identical values under `int:orcid:` and `int:isni:` — which are nonetheless distinct IIDs. Cross-scheme sameness is stated through the equivalence layer ([§8](../spec/08-equivalence.md)), never inferred from value equality.
