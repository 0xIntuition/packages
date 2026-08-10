# `hash` — Content Hash

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | polymorphic (a digest can be of any content — a file, an image, a document, a binary) |
| Natural key | A cryptographic digest of the content bytes |
| Canonical form | `<algorithm>:<64-hex-digest>` |

## What it identifies

A specific sequence of bytes, identified by its cryptographic digest. This is the purest Class B identifier in the registry: the digest *is* the content, compressed to 32 bytes — change one byte and it is provably different content. No registry participates, and nothing can revoke it.

Because a digest says nothing about what kind of thing the bytes are, the scheme is polymorphic: an `int:hash:` atom floors at profile P1 with `@type` in the payload ([§7](../spec/07-representation-profiles.md)).

Note what this scheme does **not** do. Per tenet 1 ([§0.3](../spec/00-overview.md)), hashing does not create identity — `hash` is for content that *is* bytes. Hashing a name or a set of descriptive attributes is the job of [`gen1`](./gen1.md), which is honest about the resulting weakness. `hash` carries no such weakness: collision resistance of the registered algorithms makes distinct content practically guaranteed distinct digests.

## Value grammar

```text
value     = algorithm ":" digest
algorithm = "sha256" / "keccak256"
digest    = 64 lowercase-hex          ; exactly 32 bytes
```

The value contains a colon; the full IID `int:hash:sha256:9f86…` has three. Split on the first two colons only ([§2.3](../spec/02-grammar.md)):

```text
int:hash:sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
int:hash:keccak256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

Computing a digest from content bytes is *derivation input preparation*, done before canonicalization ever runs; the canonicalizer only normalizes a digest string it is handed.

## Canonicalization

1. Trim surrounding whitespace and lowercase the entire string. Hex case is presentation; byte equality is the comparison rule ([§2.4](../spec/02-grammar.md)), so exactly one case form is canonical.
2. Match `<algorithm>:<digest>` where the digest is exactly 64 hex characters, optionally preceded by `0x`. Reject on no match — a digest of any other length (a truncated hash, a 128-hex sha512) is a rejection, not a near-miss.
3. Strip the optional `0x` prefix. It is an Ethereum-ecosystem spelling convention, not part of the digest.
4. The algorithm MUST be `sha256` or `keccak256`. Reject anything else.

Only 32-byte digests are representable. The two registered algorithms cover the web/file world (`sha256`) and the Ethereum world (`keccak256`); both produce 256-bit output, so the digest grammar is uniform.

## Validation

A value is canonical iff canonicalizing it returns it unchanged: registered algorithm, no `0x` prefix, exactly 64 lowercase hex characters. `sha256:0x9F86…` is well-formed but not valid and MUST be rejected ([§2.5](../spec/02-grammar.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `sha256:0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08` | `sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` | 0x prefix strips, digest lowercases |
| `keccak256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` | `keccak256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` | keccak256 is a registered algorithm |
| `md5:9f86d081884c7d659a2feaa0c55ad015` | ✗ reject | md5 is not a registered algorithm |

## Notes and limitations

- **The digest binds to exact bytes, not to "the work."** Re-encoding a video, resaving a JPEG, or adding one byte of metadata produces a different digest for what a human would call the same content. Digest variants of one work are joined by equivalence, not by the identifier.
- The algorithm registry is frozen with the scheme (tenet 5). Adding an algorithm — or a different digest length — ships as a new scheme name, never as an in-place edit.
- The two algorithms are distinct namespaces: `sha256:<d>` and `keccak256:<d>` never denote the same content even in the astronomically unlikely event the hex matches.
- The canonicalizer does not (and cannot, offline — tenet 4) verify that the digest corresponds to any actual content. An IID is a claim of identity, not a certificate ([§0.4](../spec/00-overview.md)).
