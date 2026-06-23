# Contributing to Intuition Packages

This repository contains the public `@0xintuition/*` package workspace. These
packages define reusable protocol helpers, deterministic ID utilities, schema
references, classification specs, predicate specs, primitives, and React
integration helpers.

Contributions should preserve two properties:

- **Determinism**: package APIs that derive atom, predicate, or triple data must
  produce stable bytes and IDs.
- **Composability**: packages should keep clear ownership boundaries so apps,
  SDKs, agents, and templates can compose them without importing more data than
  they need.

## Contribution Process

Use an issue-first workflow.

1. Open or reference an issue before starting substantial work.
2. Discuss scope before code when the change affects public APIs, package
   boundaries, deterministic IDs, schema URLs, generated data, or release
   behavior.
3. Branch from `main`.
4. Keep the PR scoped to one package layer or one cross-cutting concern.
5. Include validation commands in the PR description.

Small typo fixes can go straight to PR. Anything that affects package behavior,
generated data, package exports, or npm artifacts should have an issue.

## Package Boundaries

Prefer extending the package that owns the concept:

| Package | Owns |
| --- | --- |
| `@0xintuition/deployments` | Intuition chain metadata and deployed contract addresses |
| `@0xintuition/curves` | Bonding curve math helpers |
| `@0xintuition/schema-org` | Pinned schema.org vocabulary and inherited property lookup |
| `@0xintuition/ids` | Deterministic atom, predicate, triple, and counter-triple IDs |
| `@0xintuition/classifications` | Intuition atom classifications, recommended fields, metadata predicates, matrix rows, and creation profiles |
| `@0xintuition/predicates` | Canonical predicate specs, IDs, predicate atom data, launch sets, and predicate-level semantics |
| `@0xintuition/primitives` | Higher-level builders and validators composed from lower-level packages |
| `@0xintuition/protocol` | Core contract ABIs, event parsing, and protocol interaction helpers |
| `@0xintuition/periphery` | Periphery contract addresses and helpers |
| `@0xintuition/react` | React providers and hooks |

Avoid package cycles. Lower-level packages should not depend on product-specific
apps or higher-level composition packages.

## Semantic Contributions

This repo is intended to grow one strong shared standard, not many fragmented
registries. Contributions that add classifications, predicates, metadata
predicate relationships, creation profiles, or semantic helpers should start
from a proposal that explains the graph pattern and why it belongs in the shared
package set.

For semantic additions, include:

- the user or builder problem,
- the atoms or classifications involved,
- the predicates involved,
- the canonical triple shape, for example
  `[MusicRecording] -> [inPlaylist] -> [MusicPlaylist]`,
- expected subject and object constraints,
- whether the pattern is broadly reusable or an opinionated application pattern,
- whether it affects generated UI, creation profiles, or display helpers, and
- any migration or identity impact.

Broad reusable vocabulary generally belongs in the core packages. More
opinionated feature patterns may still belong here if the goal is to converge on
a shared Intuition convention, but they need discussion because they shape how
builders model and render graph data.

If a contributor is using a different semantic structure in their app, the
preferred path is to open a proposal or PR showing the pattern. Maintainers and
contributors should try to converge on a shared model when it improves
interoperability. If the pattern is too app-specific, it may be better as an
external integration or downstream helper rather than a core package addition.

## Generated Data

Do not hand-edit generated artifacts unless the generator and check scripts also
agree with the change.

- Schema.org data is generated from the pinned V30.0 JSON-LD source.
  - Refresh intentionally with `bun run schema-org:refresh`.
  - Verify with `bun run schema-org:check-generated`.
- Classification creation profiles are generated from classification specs,
  predicate specs, schema.org provenance, and the metadata predicate matrix.
  - Regenerate with `bun run classifications:generate-creation-profiles`.
  - Verify with `bun run classifications:check-creation-profiles`.
- Predicate generated indexes and standalone entrypoints are checked by
  `bun run predicates:check-generated`.

When adding or changing generated data, include the generator input and the
generated output in the same PR.

## Deterministic ID and Schema Safety

Treat serialized atom data and schema URLs as identity-sensitive.

- Changing JSON-LD `@context` URLs changes derived atom IDs.
- Changing predicate names or descriptions can change predicate atom IDs.
- Changing triple subject, predicate, or object order changes triple IDs.
- Do not rename public predicate keys, classification slugs, or schema constants
  casually.

If a change intentionally creates an identity fork, document that in the issue
and PR before implementation.

## Local Setup

Use Bun. The repo enforces Bun installs.

```bash
bun install --frozen-lockfile
```

## Validation

For most PRs, run the focused package tests plus the root checks that cover your
surface.

Full validation:

```bash
bun run build
bun run typecheck
bun run test
bun run check
bun run schema:validate
bun run schema-org:check-generated
bun run classifications:check-creation-profiles
bun run predicates:check-generated
bun run guard:supply-chain
bun run pack:dry-run
bun run smoke:tarballs
```

Use the full gate before release PRs, package export changes, generated data
changes, or changes that affect npm artifacts. For narrow docs-only PRs,
`git diff --check` is usually enough unless the docs describe generated output
or release behavior that should be verified.

## Review Criteria

PRs are reviewed against:

- **Correctness**: public APIs, IDs, addresses, ABI usage, schema references,
  and generated data match the intended source of truth.
- **Package fit**: the change belongs in the package being edited and does not
  introduce avoidable coupling.
- **Composability**: consumers can import focused subpaths without pulling
  unrelated registries or product-specific state.
- **Determinism**: ID-producing helpers and generated records remain stable
  unless an identity-impacting change is intentional.
- **Release safety**: package manifests, exports, tarball contents, dependency
  pins, and dist-tags stay consistent with `docs/release.md`.

## Versioning and Releases

Feature and fix PRs should call out package-impacting changes. Package version
bumps normally happen in release PRs unless the PR is explicitly scoped as a
package release.

Release PRs should:

1. choose the version bump,
2. update package manifests together,
3. keep internal `@0xintuition/*` dependency pins aligned,
4. run the full validation gate,
5. document publish order and dist-tag expectations, and
6. follow [docs/release.md](./docs/release.md).

Alpha package versions are intentionally allowed to move faster than stable
packages, but published versions must never be reused.

## Public Repo Hygiene

- Do not commit secrets, local env files, private logs, or machine-local
  artifacts.
- Keep detailed internal provenance, meeting notes, and private project-management
  context out of public docs unless the team explicitly chooses to publish it.
- Keep PR descriptions focused on what changed, why, and how it was validated.
