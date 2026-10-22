# `gtin` — Global Trade Item Number

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — offline check-digit validation |
| Scheme typing | unambiguous (trade item) |
| Authority | GS1 |
| Canonical form | 14 digits (GTIN-14), zero-padded, valid GS1 mod-10 check digit |

## What it identifies

A GTIN identifies a **trade item** — a product as it is priced, ordered, and scanned at a specific packaging level. The single can, the six-pack, and the shipping case of the same drink are three different trade items with three different GTINs. It is the number behind every UPC and EAN barcode, assigned by manufacturers from company prefixes licensed by GS1.

The GTIN family has four lengths — GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13), and GTIN-14 — that all embed the same numbering scheme at different widths. The canonical form is always the 14-digit representation: GS1 itself defines shorter GTINs as right-aligned, zero-padded views of GTIN-14, and padding on input means one product has exactly one IID no matter which barcode format a source read it from.

## Value grammar

```regex
^\d{14}$
```

with the additional constraint that the final digit is the correct GS1 mod-10 check digit over the first thirteen. The grammar alone is not sufficient — a conforming validator recomputes the check digit.

## Canonicalization

1. **Strip separators.** Remove every hyphen, dot, and whitespace character (`[-\s.]`).
2. **Match the shape** `^\d{8}$|^\d{12,14}$` — exactly 8, 12, 13, or 14 digits. Lengths 9–11, or anything non-numeric, are **rejected** (return undefined). There is no case handling; the value is digits only.
3. **Zero-pad** the value on the left to 14 digits.
4. **Verify the check digit** with the GS1 mod-10 algorithm over the padded value: starting from the *rightmost* payload digit (position 13), weight digits alternately 3, 1, 3, …; the check is `(10 − sum mod 10) mod 10` and must equal the fourteenth digit. Leading zeros carry weight zero contribution, so the check digit survives padding unchanged — this is why the padded representation is safe.
5. A failed check is a **rejection**, never a repair.

## Validation

A conforming validator accepts exactly the canonical form: 14 digits, GS1 check verified. A bare UPC-A such as `036000291452` is well-formed input but not a valid IID value; the canonical value is `00036000291452`.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `036000291452` | `00036000291452` | UPC-A pads to 14 digits |
| `4006381333931` | `04006381333931` | EAN-13 pads to 14 digits |
| `00036000291452` | `00036000291452` | canonical GTIN-14 is idempotent |
| `036000291453` | ✗ reject | check digit fails |
| `123456789` | ✗ reject | 9 digits is not a GTIN length |

## Notes and limitations

- **Padding unifies the family — and erases the input format.** After canonicalization you cannot tell whether a value arrived as a GTIN-8, UPC-A, EAN-13, or GTIN-14. This is intentional: the alternatives are one product with up to three IIDs, or an identity layer that cares about barcode symbology.
- **The check digit catches transcription errors, not lies.** Mod-10 misses some transpositions (any pair differing by 5 under alternating weights), and it proves nothing about assignment. GS1 prefixes are licensed, not published as an open registry of items, so "is this GTIN real" is not offline-answerable — only "is it well-formed".
- **GTINs are reused.** GS1 rules have historically permitted reassigning a discontinued product's GTIN after a quarantine period (rules tightened in 2019, with exceptions). A GTIN is a strong identifier of the *current* trade item, weaker as a historical one.
- **Overlap with `isbn`.** Every ISBN-13 is a valid EAN-13, so books canonicalize under both schemes (`9780684832722` vs `09780684832722`). For books, `isbn` is the preferred, more specific scheme; cross-scheme sameness belongs to the equivalence layer ([§8](../spec/08-equivalence.md)).
- Because the scheme is unambiguously typed (a trade item) and Class A, canonical `gtin` values are P0-anchor-eligible ([§7](../spec/07-representation-profiles.md)).
