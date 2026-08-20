# `isrc` — International Standard Recording Code

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline structural validation |
| Scheme typing | unambiguous (sound recording) |
| Authority | IFPI |
| Canonical form | 12 characters, uppercase, no separators: 2-letter country, 3-character registrant, 7 digits |

## What it identifies

An ISRC identifies a specific **sound recording** — a particular fixed performance, not the underlying musical work and not a physical or digital release. A studio recording, a live version, and a remaster each carry their own ISRC, while the song they all perform is one `iswc` work. This makes `isrc` the most precise identifier available for a recording, and the reason it ranks above broader schemes such as `mbid` in a recording's identity ladder ([§3.5](../spec/03-identity-classes.md#35-class-and-the-ladder)).

Codes are assigned through national agencies under IFPI's management, but the structure is fully self-describing: country prefix, registrant code, year of reference, and a designation number.

## Value grammar

```regex
^[A-Z]{2}[A-Z0-9]{3}\d{7}$
```

The seven digits are the two-digit year of reference followed by the five-digit designation code; canonicalization treats them as one digit run.

## Canonicalization

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`). The familiar `CC-XXX-YY-NNNNN` display format is presentational only.
2. **Uppercase** the result.
3. **Match the shape** `^[A-Z]{2}[A-Z0-9]{3}\d{7}$`. Return the value if it matches; **reject** (return undefined) otherwise.

There is no check digit in the ISRC standard, so there is nothing to verify or repair — validation is purely structural. This is the one T1 scheme in this group whose offline guarantee is shape alone.

## Validation

A conforming validator accepts exactly the canonical form: 12 characters, uppercase, separator-free, matching the grammar above. `int:isrc:US-RC1-76-07839` is well-formed but not valid; the canonical IID is `int:isrc:USRC17607839` — the golden P0 anchor example used throughout the specification.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `US-RC1-76-07839` | `USRC17607839` | formatted ISRC strips separators and uppercases |
| `usrc17607839` | `USRC17607839` | lowercase ISRC uppercases |
| `USRC17607839` | `USRC17607839` | canonical ISRC is idempotent |
| `USRC1760783` | ✗ reject | wrong length |
| `1SRC17607839` | ✗ reject | country prefix must be alphabetic |

## Notes and limitations

- **No check digit means no error detection.** A single-character typo in an ISRC generally yields another structurally valid ISRC. Structural validation proves the string could be an ISRC, not that it is one, and not that it was ever assigned. Treat unverified ISRCs from low-quality sources with correspondingly more suspicion than checksummed schemes.
- **Registrant positions accept digits.** The canonicalizer allows any of `[A-Z0-9]` in the three registrant characters, matching the current standard (registrant codes may be alphanumeric). Only the two country/prefix characters are restricted to letters.
- **The country prefix is historical.** Since 2004 the prefix reflects the registrant's agency allocation, not necessarily the recording's country of origin, and IFPI has since introduced non-country prefixes. The canonicalizer imposes no country-code list — any two letters pass.
- **One recording, one code — in principle.** Duplicate assignments (the same recording registered twice by different rights holders) exist in the wild. The scheme guarantees a code names at most one recording, not that a recording has at most one code; the equivalence layer ([§8](../spec/08-equivalence.md)) handles the converse.
- Because the scheme is unambiguously typed (a sound recording) and Class A, canonical `isrc` values are P0-anchor-eligible ([§7](../spec/07-representation-profiles.md)).
