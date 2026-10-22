# 4. Normalization (NORM-1)

---

## 4.1 Purpose

`NORM-1` is the frozen string-normalization algorithm applied to every text value before it enters a `gen1` preimage ([§6](./06-gen1.md)), and to handles in the [`acct`](../schemes/acct.md) scheme.

It exists to absorb the differences between sources that are *purely presentational* — encoding form, letter case, typographic punctuation, stray whitespace — while preserving every difference that could plausibly distinguish two entities.

The line between those two categories is the entire design problem, and [§4.4](#44-what-norm-1-deliberately-does-not-do) is as important as the algorithm itself.

## 4.2 The algorithm

`NORM-1` applies five steps in this exact order:

```text
1. Unicode NFKC normalization
2. Punctuation compatibility folding
3. Unicode full case folding
4. Trim leading and trailing whitespace
5. Collapse internal whitespace runs to a single U+0020
```

**The step order is frozen.** Changing it, or any step, forks every `gen1` identifier ever derived. An improved algorithm ships as `NORM-2`, paired with a new `gen2` scheme ([§9.3](./09-registry-governance.md)).

> Steps 2 and 3 happen to commute — no character in the punctuation-folding tables is case-sensitive, and no character produced by case folding appears in those tables. The order is nonetheless fixed so that any future addition to either table has one, and only one, correct interpretation.

### Step 1 — NFKC

Apply Unicode Normalization Form KC (Compatibility Composition), per [UAX #15](https://unicode.org/reports/tr15/).

NFKC resolves the cases where visually identical or semantically equivalent text has multiple valid encodings: composed vs decomposed accents (`é` as one code point or as `e` + combining acute), ligatures (`ﬁ` → `fi`), full-width forms (`Ａ` → `A`), and superscript digits (`²` → `2`).

### Step 2 — Punctuation compatibility folding

NFKC does **not** fold typographic punctuation variants, and real-world titles mix them freely — often within one dataset, sometimes within one record. Apply these substitutions:

| Fold | From | To |
| :-- | :-- | :-- |
| Apostrophes | `U+2018` `‘`, `U+2019` `’`, `U+02BC` `ʼ` | `U+0027` `'` |
| Double quotes | `U+201C` `“`, `U+201D` `”` | `U+0022` `"` |
| Dashes | `U+2013` `–`, `U+2014` `—`, `U+2212` `−` | `U+002D` `-` |

This fold is safe in a way that diacritic stripping is not: punctuation variants never distinguish two entities. `Don’t Stop Me Now` and `Don't Stop Me Now` are the same song, always. There is no pair of distinct entities separated only by a curly versus straight apostrophe.

### Step 3 — Unicode full case folding

Apply **full** case folding, per [UAX #29](https://unicode.org/reports/tr29/) — not simple lowercasing.

The distinction matters: full case folding maps some characters to *longer* sequences, which a lowercase operation will not do. The most common divergence in practice is German `ß`, which full-folds to `ss` but lowercases to itself, meaning `STRAßE` and `Straße` would otherwise fail to converge.

Implementations whose platform provides only simple lowercasing MUST additionally apply these expansions:

| Character | Folds to | Note |
| :-- | :-- | :-- |
| `U+00DF` `ß` | `ss` | Latin small letter sharp s |
| `U+1E9E` `ẞ` | `ss` | Latin capital letter sharp s |
| `U+03C2` `ς` | `U+03C3` `σ` | Greek final sigma → sigma |
| `U+0130` `İ` | `i` + `U+0307` | Latin capital I with dot above |

These are the stable simple-to-full folding divergences that survive NFKC. Any implementation providing genuine `toCaseFold` semantics satisfies this step directly.

### Step 4 — Trim

Remove leading and trailing whitespace.

### Step 5 — Collapse

Replace every run of one or more internal whitespace characters with a single space (`U+0020`).

## 4.3 Worked examples

| Input | Output | Step responsible |
| :-- | :-- | :-- |
| `"  Inception  "` | `"inception"` | 3, 4 |
| `"Don’t Stop Me Now"` | `"don't stop me now"` | 2, 3 |
| `"STRAẞE"` | `"strasse"` | 3 |
| `"Sigur Rós"` | `"sigur rós"` | 1, 3, 5 |
| `"The\tBeatles"` | `"the beatles"` | 3, 5 |
| `"Ｍｅｔａ"` | `"meta"` | 1, 3 |
| `"Jay–Z"` (en dash) | `"jay-z"` | 2, 3 |

## 4.4 What NORM-1 deliberately does not do

These omissions are decisions, not gaps. Each one was considered and rejected.

### No diacritic stripping

`Björk` and `Bjork` normalize to different strings, and therefore derive different identifiers.

This looks like a bug and is not. Stripping diacritics is a *guess* that two differently-spelled names refer to one entity. Sometimes that guess is right; often it is not — `Sale` and `Salé` are different places, `resume` and `résumé` are different words. Deciding two spellings mean one thing is a **merge decision**, and merge decisions belong to the equivalence layer, where they can be attested, disputed, and reversed ([§8](./08-equivalence.md)). Bake the guess into the hash and it becomes irreversible and invisible.

### Nothing language-specific

`NORM-1` contains no rule that depends on the language of its input. No `&` ↔ `and` substitution. No `The Beatles` ↔ `Beatles, The` inversion. No stop-word removal, no stemming, no transliteration.

Such rules are correct for some languages and wrong for others, and a normalization algorithm that behaves differently depending on a locale is not deterministic in the sense this specification requires ([§0.3](./00-overview.md), tenet 4).

### Nothing domain-specific

No stripping of `(feat. …)` credits, no removal of `(Remastered 2011)`, no `Vol. 2` handling.

These transformations are genuinely useful and often necessary — they simply belong to **enrichment**, applied before derivation to produce a better input, rather than inside normalization. Placing them in enrichment keeps them improvable; placing them in `NORM-1` freezes them forever and makes every future correction a fork.

### No length limiting or truncation

`NORM-1` does not truncate. Length constraints belong to the grammar ([§2.2](./02-grammar.md)), and `gen1` values are fixed-length by hashing regardless of input size.

## 4.5 Non-string values

`NORM-1` applies to strings. Other value types entering a `gen1` preimage are canonicalized as follows:

| Type | Canonical form |
| :-- | :-- |
| Date | ISO 8601 `YYYY-MM-DD`. A recipe MAY specify year-only precision, in which case `YYYY`. |
| Number | Shortest round-tripping decimal form. No exponent, no trailing zeros, no leading `+`. |
| Boolean | Not permitted in a recipe. |
| Array | Not permitted in a recipe — recipes name scalar fields only ([§6.3](./06-gen1.md)). |
| Null / absent | Not permitted. An absent recipe field means the rung does not fire ([§5.3](./05-identity-ladders.md)). |

## 4.6 Requirements

1. Implementations MUST apply the five steps in the specified order.
2. `NORM-1` MUST be a pure function: same input, same output, on every platform, in every locale, forever.
3. `NORM-1` MUST NOT be applied to values of Class A or Class B schemes. Those schemes define their own canonicalization, which is frequently stricter and occasionally case-*preserving* — applying `NORM-1` to them would corrupt valid values. The sole exception is the weak (handle) form of [`acct`](../schemes/acct.md), where `NORM-1` is specified explicitly.
4. A value that is empty after `NORM-1` MUST be treated as absent, which means the rung requiring it does not fire.

---

**Previous:** [3. Identity classes](./03-identity-classes.md) · **Next:** [5. Identity ladders](./05-identity-ladders.md)
