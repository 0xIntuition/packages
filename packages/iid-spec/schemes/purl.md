# `purl` — Package URL

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | unambiguous (a software package) |
| Natural key | A package's ecosystem + name |
| Canonical form | `<ecosystem>/<name>` — a [package-url](https://github.com/package-url/purl-spec) with `pkg:` prefix, version, qualifiers, and subpath removed, lowercased |

## What it identifies

A software package: the named unit within an ecosystem's namespace (`npm/react`, `golang/github.com/gorilla/mux`). Ecosystem registries enforce name uniqueness as a technical property of package resolution, which makes ecosystem + name a natural key.

The IID identifies the **package, not a release**. Per the abstraction-level table in [§5.5](../spec/05-identity-ladders.md), the software domain's stack is package → version, and the entity we identify is the package — so version qualifiers are stripped during canonicalization. `react@18.2.0` and `react@18.3.0` are the same entity at this level; versions are claims about the package, not separate identities.

The scheme is unambiguously typed — a `purl` is always a software package — so it is eligible for P0 anchoring ([§7](../spec/07-representation-profiles.md)).

## Value grammar

```text
value     = ecosystem "/" name
ecosystem = 1*( ALPHA / DIGIT / "." / "+" / "-" )
name      = 1*( any non-whitespace )        ; may itself contain slashes
```

The value contains slashes (and may contain many: Go module paths nest); the IID parser treats everything after `int:purl:` as opaque ([§2.3](../spec/02-grammar.md)):

```text
int:purl:npm/react
int:purl:golang/github.com/gorilla/mux
```

## Canonicalization

1. Trim surrounding whitespace.
2. Strip a leading `pkg:` prefix (case-insensitive). It is redundant inside an IID — the scheme name already says "package".
3. Truncate at the first `@`, `?`, or `#`, discarding everything from that character on. In package-url syntax these introduce the version, the qualifiers, and the subpath respectively — all release-level or retrieval-level detail, none of it identity at the package abstraction level.
4. The remainder MUST match `<ecosystem>/<name>`: an ecosystem token of letters, digits, `.`, `+`, `-`, a slash, and a non-empty name. Reject otherwise (a bare name with no ecosystem is meaningless — `react` exists in npm, and nothing else says so).
5. Lowercase the entire value. Ecosystem names are case-insensitive in the purl spec, and folding the name as well gives one byte form per package under byte-exact comparison ([§2.4](../spec/02-grammar.md)).

## Validation

A value is canonical iff canonicalizing it returns it unchanged: no `pkg:` prefix, no `@`/`?`/`#` remainder, all lowercase, ecosystem and name present. `pkg:npm/react` and `npm/React` are well-formed but not valid and MUST be rejected ([§2.5](../spec/02-grammar.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `pkg:npm/react@18.2.0` | `npm/react` | pkg: prefix and version strip |
| `npm/react` | `npm/react` | canonical purl is idempotent |
| `pkg:golang/github.com/gorilla/mux` | `golang/github.com/gorilla/mux` | nested path purl |
| `react` | ✗ reject | missing ecosystem |

## Notes and limitations

- **Scoped npm packages are not representable.** Truncation at the first `@` (step 3) cuts `npm/@babel/core` down to `npm/`, which then fails the shape check and is rejected. This is a known limitation of the frozen v1 rules (tenet 5); scoped-package support would ship as a successor scheme, and until then scoped packages fall through to the next ladder rung.
- **Whole-value lowercasing is deliberately stronger than the purl spec**, which leaves name case sensitivity to each ecosystem. Ecosystems with case-sensitive names (some Maven artifact IDs, Go module paths with mixed-case hosts) will fold case variants together. Go's own module system applies exactly this fold (via `!`-escaping) because case-only distinctions are a known hazard; where two genuinely distinct packages differ only by case, they collide here, and the collision is surfaced by equivalence rather than hidden.
- Qualifiers (`?arch=…`) and subpaths (`#lib/…`) are retrieval detail, never identity; their removal is unconditional.
- A package's source-repository URL is a related but different entity ([`url`](./url.md)); linking package to repo is a relationship claim, not identity (tenet 3).
