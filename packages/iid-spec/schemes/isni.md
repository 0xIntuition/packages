# `isni` — International Standard Name Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline check-digit validation |
| Scheme typing | polymorphic (identifies persons AND bands/organizations) |
| Authority | ISNI International Agency |
| Canonical form | 16 characters, no separators: 15 digits + ISO 7064 mod 11-2 check character (`0`–`9` or `X`) |

## What it identifies

An ISNI identifies a **public identity of a party** — a person, a persona, a band, an organization, a publisher. This breadth is the scheme's purpose (it exists to disambiguate names across the entire creative supply chain) and also its structural weakness as an anchor: nothing in the value says whether `0000000121032683` is a human being or a corporation. The same registry, the same format, and the same check algorithm cover both.

That is what "polymorphic" means here, and it has a hard consequence: an `isni` IID alone cannot type the entity it names.

## Value grammar

```regex
^\d{15}[\dX]$
```

with the additional constraint that the final character is the correct ISO 7064 mod 11-2 check character over the first 15 digits. The grammar alone is not sufficient — a conforming validator recomputes the check character.

## Canonicalization

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`). ISNIs are conventionally displayed in four space-separated groups of four; the grouping carries no identity.
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

A conforming validator accepts exactly the canonical form: 16 characters, separator-free, check character verified. The spaced display form `0000 0001 2103 2683` is input to canonicalization, never a valid IID value.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `0000 0001 2103 2683` | `0000000121032683` | spaced ISNI strips separators |
| `0000000121032683` | `0000000121032683` | canonical ISNI is idempotent |
| `0000000121032684` | ✗ reject | check character fails |
| `000000012103268` | ✗ reject | wrong length |

## Notes and limitations

- **Polymorphism floors this scheme at P1.** Because the value cannot imply the entity's classification, an `isni` IID is never P0-anchor-eligible — the `@type` must live in the payload, per [§7](../spec/07-representation-profiles.md). This is a property of the scheme, fixed forever, not of any individual identifier.
- **The check character catches transcription errors, not lies.** ISO 7064 mod 11-2 detects all single-character errors and adjacent transpositions; it says nothing about whether the ISNI was assigned or to whom.
- **ORCID lives inside this namespace.** ORCID iDs are issued from a block reserved within the ISNI range and use the identical format and check algorithm; the [`orcid`](./orcid.md) scheme shares this canonicalizer verbatim. The two remain distinct schemes because they are distinct authorities with distinct assignment policies.
- **One party may hold several ISNIs** (legacy duplicates, persona vs. legal name), and the registry merges them over time. Superseded ISNIs are a matter for the equivalence layer ([§8](../spec/08-equivalence.md)); canonicalization neither knows nor cares about merge history.
