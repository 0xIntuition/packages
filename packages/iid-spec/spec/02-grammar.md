# 2. Grammar

---

## 2.1 Syntax

An IID is a string of three parts: a fixed namespace prefix, a registered scheme, and a scheme-owned value.

```abnf
iid     = "int" ":" scheme ":" value

scheme  = 1*32 scheme-char
scheme-char = %x61-7A / DIGIT / "-"          ; a-z, 0-9, hyphen

value   = 1*220 value-char
value-char  = %x21-7E                         ; visible ASCII, no space
```

Example, with the parts labelled:

```text
int : caip10 : eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045
 │      │                          │
 │      │                          └── value — opaque; owned by the caip10 scheme
 │      └───────────────────────────── scheme — registered, lowercase
 └──────────────────────────────────── namespace — always "int"
```

## 2.2 Requirements

1. The namespace prefix MUST be exactly `int:`. It is case-sensitive.
2. The scheme MUST be a lowercase name present in the [scheme registry](../schemes/README.md). A well-formed IID bearing an unregistered scheme is **not** a valid IID ([§1.3.1](./01-conformance.md)).
3. The value MUST be non-empty and MUST consist only of visible ASCII characters in the range `%x21`–`%x7E`. Space, control characters, and all non-ASCII are prohibited.
4. The complete IID MUST NOT exceed **256 bytes**. This total is the binding constraint; the per-part maxima in [§2.1](#21-syntax) bound the parts individually but their sum is not independently reachable.
5. Non-ASCII input — names, titles, any natural-language text — MUST NOT appear raw in an IID. Such input reaches an IID only through a `gen*` hash scheme ([§6](./06-gen1.md)) or a scheme-specific encoding.

> **Note.** Requirement 4 exists because IIDs are embedded in on-chain atom data, where payload size has a direct cost. Requirement 5 exists because byte-exact comparison over arbitrary Unicode is a source of silent, encoding-dependent mismatches; the hash schemes exist precisely so that natural-language input has one well-defined path into the identifier space.

## 2.3 Parsing

**A parser MUST split on the first two colons only.**

Everything after the second colon is a single opaque value belonging to the scheme. Values routinely contain further colons and slashes — this is intended, not an escaping failure:

| IID | Scheme | Value |
| :-- | :-- | :-- |
| `int:isbn:9780684832722` | `isbn` | `9780684832722` |
| `int:doi:10.1000/182` | `doi` | `10.1000/182` |
| `int:caip10:eip155:1:0xd8da…` | `caip10` | `eip155:1:0xd8da…` |
| `int:hash:sha256:9f86d081…` | `hash` | `sha256:9f86d081…` |
| `int:gen1:movie:r4:fb681afe…` | `gen1` | `movie:r4:fb681afe…` |
| `int:mbid:artist:056e4f3e-…` | `mbid` | `artist:056e4f3e-…` |

A parser that splits on *all* colons will mis-parse the majority of Class B identifiers. This is the single most common implementation error against this specification.

A generic parser MUST NOT attempt to interpret internal structure within a value. Sub-structure — the `artist:` in an MBID, the `r4` in a `gen1` value — is defined by the owning scheme and is meaningful only to code that knows the scheme.

## 2.4 Comparison

**Two IIDs are equal if and only if their byte sequences are identical.**

There is no case-insensitive matching, no Unicode normalization, no whitespace tolerance, and no scheme-specific equivalence at the identifier layer. All folding happens earlier, inside canonicalization, per scheme.

This is a deliberate and consequential choice. It means:

- Comparison is a memory comparison. It is correct in every language, in SQL, in a hash-map key, and in a smart contract, with no library.
- The full burden of "these two strings mean the same thing" falls on canonicalization, which is where it can be specified exactly and tested.
- An uncanonicalized value that reaches the identifier layer will simply fail to match. It will not *approximately* match, and it will not be silently repaired.

Implementations MUST canonicalize before comparison, never during it.

## 2.5 Canonical form

A value is in **canonical form** iff canonicalizing it yields itself:

```text
isCanonical(v)  ⇔  canonicalize(v) = v
```

An IID is **valid** iff it is well-formed per [§2.2](#22-requirements), its scheme is registered, and its value is in that scheme's canonical form.

Validity therefore requires more than well-formedness. `int:isbn:0-684-83272-0` is well-formed and refers to a real book, but is **not valid**: the `isbn` scheme's canonical form is a hyphen-free ISBN-13, so this string would never be produced by a conforming deriver and MUST be rejected by a conforming validator. The correct IID is `int:isbn:9780684832722`.

## 2.6 Relationship to URNs

This grammar is deliberately shaped like a URN ([RFC 8141](https://www.rfc-editor.org/rfc/rfc8141)) with `int` as the namespace identifier. This specification adopts URN *discipline* — a governed namespace registry, per-namespace value syntax, explicit canonical-equivalence rules — without claiming RFC 8141 conformance or registering with IANA.

The divergence is intentional and specific: RFC 8141 defines case-insensitive equivalence for parts of a URN, which is incompatible with the byte-exact comparison rule in [§2.4](#24-comparison). Adopting RFC 8141's equivalence would reintroduce exactly the ambiguity that byte-exactness eliminates.

Should external tooling ever require URN form, the mapping is mechanical, lossless, and bidirectional:

```text
int:<scheme>:<value>   ↔   urn:int:<scheme>:<value>
```

## 2.7 Reference regular expression

Non-normative; provided for convenience. The scheme registry check and the canonical-form check are separate steps and are **not** covered by this expression.

```regex
^int:([a-z0-9-]{1,32}):([\x21-\x7E]{1,220})$
```

Full validation is three steps, in order:

1. Match the shape above.
2. Look the scheme up in the registry; reject if absent.
3. Ask the scheme whether the value is in canonical form; reject if not.

---

**Previous:** [1. Conformance](./01-conformance.md) · **Next:** [3. Identity classes](./03-identity-classes.md)
