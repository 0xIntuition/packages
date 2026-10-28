# `lei` — Legal Entity Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline check-digit validation |
| Scheme typing | unambiguous (legal entity) |
| Authority | GLEIF |
| Canonical form | 20 characters, uppercase, no separators: 18 alphanumerics + 2 check digits, ISO 7064 mod 97-10 valid |

## What it identifies

An LEI identifies a **legal entity** — a company, fund, government body, or other organization that is a party to financial transactions. It is the ISO 17442 identifier managed by the Global Legal Entity Identifier Foundation and issued through accredited Local Operating Units, created after the 2008 financial crisis precisely so that "who is this counterparty" would have one global, verifiable answer.

The abstraction level is the *legal* entity: a brand, a trading name, or a corporate group is not what an LEI names — each legally distinct subsidiary carries its own LEI. GLEIF publishes the full reference dataset openly, but the identifier itself validates offline via its ISO 7064 check pair, which is what places the scheme at T1.

## Value grammar

```regex
^[A-Z0-9]{18}\d{2}$
```

with the additional constraint that the full 20-character string satisfies ISO 7064 mod 97-10 (remainder 1). The grammar alone is not sufficient — a conforming validator recomputes the check.

## Canonicalization

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`). LEIs are sometimes displayed in spaced groups of four; the grouping carries no identity.
2. **Uppercase** the result.
3. **Match the shape** `^[A-Z0-9]{18}\d{2}$` — 18 alphanumerics followed by exactly two digits. Anything else is **rejected** (return undefined). Note this catches the classic `O`-for-`0` confusion when it lands in the check positions.
4. **Verify per ISO 7064 mod 97-10** over the entire 20-character string, check digits included:

   ```text
   map each character: digits stay themselves, letters map A=10 … Z=35
   process the resulting digit stream left to right:
       remainder = (remainder × 10 + digit) mod 97
   valid iff remainder = 1
   ```

   A failed check is a **rejection**, never a repair.

## Validation

A conforming validator accepts exactly the canonical form: 20 characters, uppercase, separator-free, mod 97-10 remainder 1. Lowercase or spaced presentations are input to canonicalization, never valid IID values.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `5493 00B2 N3T1 CIB4 3O74` | ✗ reject | letter O in what must be digits region |
| `529900T8BM49AURSDO55` | `529900T8BM49AURSDO55` | canonical LEI is idempotent |
| `529900t8bm49aursdo55` | `529900T8BM49AURSDO55` | lowercase LEI uppercases |
| `529900T8BM49AURSDO54` | ✗ reject | mod 97-10 validation fails |

## Notes and limitations

- **The check pair catches transcription errors, not lies.** Mod 97-10 detects all single-character errors and virtually all transpositions, but it proves nothing about issuance. Whether an LEI is *active* — entities lapse when they stop paying renewal fees — is a GLEIF registry question, entirely outside offline validation. A canonical LEI may belong to a dissolved company.
- **Internal structure is not interpreted.** The first four characters encode the issuing LOU and characters 5–6 are reserved zeros under ISO 17442, but the canonicalizer treats the 18-character body as opaque. Enforcing sub-structure would couple canonicalization to registry policy that has already changed once (pre-2017 LEIs predate the prefix allocation rules).
- **Legal entity ≠ organization in the colloquial sense.** One operating business may hold many LEIs across its subsidiaries and funds. Rolling those up into a group is graph work, via the equivalence layer ([§8](../spec/08-equivalence.md)) and explicit relationships — never by identifier.
- Because the scheme is unambiguously typed (a legal entity) and Class A, canonical `lei` values are P0-anchor-eligible ([§7](../spec/07-representation-profiles.md)).
