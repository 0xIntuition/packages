# `isbn` — International Standard Book Number

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline check-digit validation |
| Scheme typing | unambiguous (book edition) |
| Authority | International ISBN Agency |
| Canonical form | 13 digits, no separators, valid GS1 mod-10 check digit |

## What it identifies

An ISBN identifies a specific **edition** of a book — not the work. The hardcover, the paperback, the e-book, and the revised second edition of the same text each carry a different ISBN, because that is the granularity at which the International ISBN Agency and its national agencies assign numbers. Statements attached to `int:isbn:` atoms are statements about that edition; work-level identity, where it exists, belongs to a work-level scheme.

The canonical form is always ISBN-13. ISBN-10, the pre-2007 format, is accepted as input and upconverted; it never appears in a canonical value. This gives every book edition exactly one IID regardless of which format a source happened to print.

## Value grammar

```regex
^\d{13}$
```

with the additional constraint that the final digit is the correct GS1 mod-10 check digit over the first twelve. The grammar alone is not sufficient — a conforming validator recomputes the check digit.

## Canonicalization

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`). ISBN hyphenation is presentational and varies by registration group; it carries no identity.
2. **Uppercase** the result, folding a lowercase `x` check digit to `X`.
3. **ISBN-10 input** — if the result matches `^\d{9}[\dX]$`:
   1. Verify the ISBN-10 check digit: weight the first nine digits 10, 9, …, 2 and sum; the check is `(11 − sum mod 11) mod 11`, rendered `X` when it equals 10. If the tenth character does not match, **reject** (return undefined).
   2. Upconvert: prefix the nine payload digits with `978`, then append the GS1 mod-10 check digit computed over that 12-digit core. The GS1 algorithm weights digits 3, 1, 3, … starting from the *rightmost* payload digit; the check is `(10 − sum mod 10) mod 10`.
4. **ISBN-13 input** — if the result matches `^\d{13}$`: verify that the GS1 mod-10 check digit over the first twelve digits equals the thirteenth. Return the value unchanged if it does; **reject** if it does not.
5. **Anything else** — wrong length, stray characters — **reject**.

An invalid check digit is always a rejection, never a repair. Recomputing a "corrected" check digit would silently convert one transcription error into a confidently wrong identifier.

## Validation

A conforming validator accepts exactly the canonical form: 13 digits, separator-free, GS1 check digit verified. `int:isbn:0-684-83272-0` is well-formed and names a real book, but it is not valid — hyphenated and in ISBN-10 form, it would never be produced by a conforming deriver ([§2.5](../spec/02-grammar.md#25-canonical-form)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `0-684-83272-0` | `9780684832722` | ISBN-10 with hyphens upconverts to ISBN-13 |
| `9780684832722` | `9780684832722` | canonical ISBN-13 is idempotent |
| `978-0-14-044913-6` | `9780140449136` | hyphenated ISBN-13 strips separators |
| `0-306-40615-3` | ✗ reject | ISBN-10 check digit fails (expected 2) |
| `9780684832723` | ✗ reject | ISBN-13 check digit fails |
| `12345` | ✗ reject | wrong length |

## Notes and limitations

- **The check digit catches transcription errors, not lies.** It proves the string is internally consistent, not that the ISBN was ever assigned or that it names the book a claimant says it does. T1 validation is a structural guarantee; assignment is the Agency's.
- **Bookland prefixes are not enforced.** Real ISBN-13s begin `978` or `979`, but the canonicalizer accepts any 13-digit string with a valid GS1 check digit. A GS1-valid non-Bookland string will canonicalize under this scheme; keeping such values out is a data-quality concern upstream of canonicalization.
- **ISBN-10 with check digit `X` upconverts cleanly** — the `X` encodes the value 10 in the mod-11 scheme and is discarded on upconversion, replaced by a freshly computed GS1 digit.
- **Overlap with `gtin`.** Every ISBN-13 is a valid EAN-13, so the same edition can also canonicalize under `gtin` (as a 14-digit zero-padded value). The two IIDs are distinct byte strings identifying the same trade item at different semantic levels; `isbn` is the preferred, more specific scheme for books.
- Because the scheme is unambiguously typed (a book edition) and Class A, canonical `isbn` values are P0-anchor-eligible ([§7](../spec/07-representation-profiles.md)).
