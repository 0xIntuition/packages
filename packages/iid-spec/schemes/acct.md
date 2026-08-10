# `acct` — Platform Account

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | unambiguous (a platform account) |
| Natural key | A platform's immutable user ID (strong form) or a handle (weak form) |
| Canonical form | `<platform>:<id>` or `<platform>:@<handle>` |

## What it identifies

An `acct` value names an account on an online platform: `int:acct:github:583231` is one GitHub account, forever. The scheme has **two forms with deliberately different strength**, distinguished by the `@` sigil:

- **Strong form** — `<platform>:<id>`. The identifier is the platform's immutable, never-recycled internal user ID (typically numeric or opaque). This is the natural key: the platform enforces its uniqueness and never reassigns it, satisfying admission criterion 1 ([§9.2](../spec/09-registry-governance.md)) the same way a blockchain enforces an address.
- **Weak form** — `<platform>:@<handle>`. The identifier is the user-visible handle. Handles are renamed and recycled routinely — which is exactly why social handles were rejected as a primary identifier ([§9.5](../spec/09-registry-governance.md)) and survive only here, as a *documented* weak form that ranks a rung below the strong form in every ladder that uses both.

The `@` is load-bearing: it makes the weakness visible in the identifier itself, so `github:583231` and `github:@monalisa` can never be confused for equally trustworthy statements.

## Value grammar

```regex
^[a-z0-9-]+:@?[^\s]+$
```

The platform is a lowercase token of letters, digits, and hyphens. The identifier is any non-empty run of characters containing no whitespace; it is opaque to this scheme and MAY itself contain colons — per [§2.3](../spec/02-grammar.md) only the first colon (after the platform token) is structural. The platform namespace is open: any platform token matching the grammar is acceptable, because there is no registry that could enumerate every platform.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Match `^([a-z0-9-]+):(@?)(.+)$` case-insensitively. On no match, **reject**.
3. Lowercase the platform token.
4. If the `@` sigil is present (weak form), apply `NORM-1` ([§4](../spec/04-normalization.md)) to the handle. If absent (strong form), preserve the identifier **byte for byte** — including case.
5. If the resulting identifier is empty or contains any whitespace, **reject**.
6. Reassemble as `<platform>:<@ if handle><identifier>`.

Step 4 is the single place in the entire registry where `NORM-1` touches a Class B scheme — the explicit exception recorded in [§4.6](../spec/04-normalization.md) rule 3. Handles are user-chosen natural-language-adjacent strings displayed with arbitrary casing, so they need the same presentational folding as any name. Strong IDs are platform-assigned tokens where case may be significant, so folding them would corrupt valid values.

## Validation

A conforming validator accepts a value iff canonicalizing it yields itself: platform lowercase, handle (if present) a `NORM-1` fixed point, no whitespace, identifier non-empty. Note that [§2.2](../spec/02-grammar.md) independently restricts IID values to visible ASCII — a handle that remains non-ASCII after `NORM-1` (e.g. `@björk`) cannot form a valid IID even though this canonicalizer does not itself reject it.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `github:583231` | `github:583231` | strong form: immutable numeric ID, case preserved |
| `twitter:@Jack` | `twitter:@jack` | weak handle form applies NORM-1 |
| `GitHub:MonaLisa` | `github:MonaLisa` | platform lowercases; strong ID case preserved |
| `github:` | ✗ reject | empty identifier |

## Notes and limitations

- **Why two forms exist at all.** The strong form alone would be ideal, but immutable user IDs are frequently unavailable to an importer — platforms display handles and hide IDs. Refusing to mint anything would push accounts down to `gen1` hashes of the handle string, which is strictly worse: the weak form at least preserves the platform scope and the recycling caveat in a legible way. When the strong ID is later learned, both identifiers coexist and are joined by equivalence ([§8](../spec/08-equivalence.md)).
- **The weak form can lie over time.** A recycled handle means `twitter:@jack` may name different accounts in different years. This is precisely the failure mode of [§9.2](../spec/09-registry-governance.md) criterion 1, accepted here only because the identifier *advertises* its own weakness. Statements anchored to a weak-form account should be read with that clock in mind.
- **Platform tokens are conventions, not a registry.** `github`, `twitter`, `x` are distinct tokens; nothing in the scheme knows that two of them may be the same platform renamed. Cross-platform-token identity is, like all identity beyond the byte level, an equivalence-layer concern.
- **Unambiguous typing.** Every `acct` value is an account; the scheme is one of the Class B schemes eligible for P0 anchoring ([§7.2](../spec/07-representation-profiles.md)) on both forms — anchor eligibility reflects typing, not strength.
