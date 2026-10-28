# Package map

The registry in `scripts/package-registry.mjs` defines dependency-first build and publication order.

| Package | Version | Purpose |
| --- | --- | --- |
| `@0xintuition/iid-spec` | `0.1.0-alpha.0` | The Intuition ID (IID) specification: a deterministic, canonical identifier for real-world entities, with normative per-scheme rules and machine-readable conformance vectors |
| `@0xintuition/iid` | `0.1.0-alpha.0` | Intuition Identifier (IID) reference implementation: deterministic entity identifiers, scheme canonicalizers, NORM-1, gen1 derivation, and the declarative identity-ladder engine |
| `@0xintuition/deployments` | `0.1.0-alpha.1` | Intuition contract ABIs, bytecode, deployment addresses and chain metadata |
| `@0xintuition/curves` | `0.1.0-alpha.1` | Mathematical curve helpers for Intuition bonding curve flows |
| `@0xintuition/ids` | `0.1.0-alpha.1` | Deterministic content-addressable ID utilities for the Intuition protocol |
| `@0xintuition/schema-org` | `0.1.0-alpha.1` | Pinned schema.org type and property vocabulary for Intuition data packages |
| `@0xintuition/classifications` | `0.1.0-alpha.1` | Canonical Intuition classification specs and atom data builders |
| `@0xintuition/pipeline-runtime` | `0.1.0-alpha.0` | Effect-free Promise utilities, cancellation, provider observation, and provider host policies |
| `@0xintuition/atom-parser` | `0.1.0-alpha.0` | Detect and normalize atom inputs, with optional remote content inspection |
| `@0xintuition/iid-registry` | `0.1.0-alpha.0` | Pure scheme-to-classification and scheme-to-provider resolution for Intuition Identifiers (IIDs): the semantic bridge between the IID grammar and Intuition classifications |
| `@0xintuition/iid-ladder` | `0.1.0-alpha.0` | Shared strong-identifier, provider-handle, and canonical-URL projection ladder for Intuition Identifiers |
| `@0xintuition/predicates` | `0.1.0-alpha.1` | Canonical Intuition predicate registry, entity mappings, and display helpers |
| `@0xintuition/primitives` | `0.1.0-alpha.1` | High-level Intuition atom, claim, and validation primitives |
| `@0xintuition/protocol` | `3.0.0-alpha.0` | Intuition protocol contract ABIs and interaction helpers |
| `@0xintuition/atom-enrichment` | `0.1.0-alpha.0` | Composable atom enrichment engine, provider adapters, extraction, and cache contracts |
| `@0xintuition/atom-classification` | `0.1.0-alpha.0` | Composable atom classification engine, plugins, and configurable runtime presets |
| `@0xintuition/periphery` | `0.1.0-alpha.1` | Intuition periphery contract ABIs and bridge helper utilities |
| `@0xintuition/sdk` | `4.0.0-alpha.0` | Intuition SDK |
| `@0xintuition/cli` | `0.1.0-alpha.0` | Agent-oriented calldata encoders and the intuition executable for Intuition protocol workflows; action envelope builders live in @0xintuition/sdk. |
| `@0xintuition/react` | `0.1.0-alpha.1` | React hooks for core Intuition protocol interactions |
| `@0xintuition/atom-runtime` | `0.1.0-alpha.0` | Promise-based composition root for atom classification and enrichment |

The atom packages use Promise and AbortSignal APIs. `atom-runtime` composes classification and enrichment, filters injected environment values, and memoizes engines. Applications own persistence, queues, and optional Effect wrappers.
