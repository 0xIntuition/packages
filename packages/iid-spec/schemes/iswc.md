# `iswc` — International Standard Musical Work Code

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline check-digit validation |
| Scheme typing | unambiguous (musical work) |
| Authority | CISAC |
| Canonical form | `T` followed by 10 digits (9-digit work code + mod-10 check digit), no separators |

## What it identifies

An ISWC identifies a **musical work** — the composition itself, the abstraction that composers and lyricists create and that publishers administer. It deliberately sits one level above `isrc`: a single ISWC work may have hundreds of ISRC recordings (covers, live takes, remasters), and the pairing of the two schemes is what lets a graph distinguish "this song" from "this recording of this song".

Codes are assigned by CISAC through its network of collecting societies when a work is registered for rights administration.

## Value grammar

```regex
^T\d{10}$
```

with the additional constraint that the final digit is the correct mod-10 check digit over the nine work-code digits. The grammar alone is not sufficient — a conforming validator recomputes the check digit.

## Canonicalization

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`). The display format `T-034.524.680-1` uses both dots and hyphens; none of it carries identity.
2. **Uppercase** the result, folding a lowercase `t` prefix.
3. **Match the shape** `^T\d{10}$`. Anything else — a missing `T`, wrong length — is **rejected** (return undefined).
4. **Verify the check digit.** Let d₁…d₉ be the nine work-code digits (the characters after `T`, excluding the last). Compute:

   ```text
   sum   = 1 + Σ (i × dᵢ)   for i = 1…9
   check = (10 − sum mod 10) mod 10
   ```

   The value is valid iff `check` equals the tenth digit. A mismatch is a **rejection**, never a repair.

Note the algorithm's two idiosyncrasies, both faithful to the CISAC standard: the sum is seeded with 1, and each digit is weighted by its 1-based position.

## Validation

A conforming validator accepts exactly the canonical form: `T` plus 10 digits, separator-free, check digit verified. Formatted values such as `T-034.524.680-1` are input to canonicalization, never valid IID values.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `T-034.524.680-1` | `T0345246801` | formatted ISWC strips separators |
| `T0345246801` | `T0345246801` | canonical ISWC is idempotent |
| `T0345246802` | ✗ reject | check digit fails |
| `0345246801` | ✗ reject | missing T prefix |

## Notes and limitations

- **The check digit catches transcription errors, not lies.** It proves internal consistency, not assignment. Whether `T0345246801` is registered to the work a claimant says it is remains a registry question outside T1's offline guarantee.
- **Work-level identity is genuinely hard**, and ISWC inherits that difficulty from the rights world it serves: arrangements, translations, and medleys each get distinct ISWCs, and duplicate registrations of the same work by different societies occur. As with `isrc`, the scheme guarantees one code names at most one work; the converse is handled by the equivalence layer ([§8](../spec/08-equivalence.md)).
- **Coverage is skewed toward administered repertoire.** Works outside collecting-society administration often have no ISWC at all, which is precisely when a ladder falls through to `mbid` work IDs or `gen1`.
- The classification a canonical ISWC maps to is a registry concern, not a canonicalization concern — the canonicalizer answers only "is this a well-formed, check-valid ISWC".
- Because the scheme is unambiguously typed (a musical work) and Class A, canonical `iswc` values are P0-anchor-eligible ([§7](../spec/07-representation-profiles.md)).
