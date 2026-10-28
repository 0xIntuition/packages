# Atom runtime migration and release runbook

This migration reconciles the reusable atom packages with the application lineage and exposes a shared Promise-based composition root for Core and other consumers. It prepares coordinated releases; it does not authorize publication, pushing branches, opening PRs, or merging them. Those actions remain gated on the release owner's explicit instruction. The existing package train is still awaiting registry publication. This document describes required checks, not a claim that every release gate has passed.

## Ownership

| Package | Initial public version | Public library owns | Core owns |
| --- | --- | --- | --- |
| `@0xintuition/atom-parser` | `0.1.0-alpha.0` | Input detection, normalization, optional remote inspection, parser types | Configured fetch policy and worker integration |
| `@0xintuition/atom-classification` | `0.1.0-alpha.0` | Classification engine, plugin contracts, reusable classifiers/resolvers, configurable presets | Enabled plugins, application fallback policy, injected identity capabilities and service wiring |
| `@0xintuition/atom-enrichment` | `0.1.0-alpha.0` | Enrichment engine, provider adapters, extraction, artifact validation, cache interfaces and reusable adapters | Credentials, cache provisioning/configuration, queue scheduling, retries, persistence and service wiring |
| `@0xintuition/atom-runtime` | `0.1.0-alpha.0` | Shared configuration, preset composition, cache setup, fingerprints and memoized engines | Persistence, scheduling and application lifecycle |

`@0xintuition/classifications@0.1.0-alpha.1` remains the canonical entity specification dependency of enrichment. It depends on `@0xintuition/iid@0.1.0-alpha.0`. The enrichment artifact registry validates provider payloads and does not replace those specifications. `@0xintuition/iid-registry` remains responsible for IID provider planning. The extraction does not activate production IID adapters or redesign the taxonomy.

The plugin authoring example lives at [`examples/atom-classification-plugin`](../examples/atom-classification-plugin). Its manifest is private; it is not a public runtime package or a Core production dependency. The public atom packages preserve their established imports through typed ESM exports. Their implementation tests and provider fixtures belong beside their implementations in this repository; Core retains integration and acceptance coverage.

## Preparation gates

1. Build, typecheck, test and lint this repository using its pinned toolchain. Include the package registry, release metadata, supply-chain and contract artifact checks documented in [the release strategy](./release.md).
2. Pack the candidate artifacts from the exact reviewed revision. Record the package names, versions and SHA-256 digests. Inspect tarball contents for declarations, compiled JavaScript, README and license, and ensure no local paths, secrets, Core dependencies or unpublished workspace references escape into runtime manifests.
3. Install those tarballs in an isolated consumer outside either repository. Import every runtime export under both Node and Bun, compile a consumer against the emitted declarations, and exercise representative parser, classification and enrichment behavior. Run the enrichment public testing helper under Node as well as its existing Bun suites. Workspace source resolution alone is insufficient evidence for publication.
4. Install the same artifacts into an isolated Core checkout and run Core's build/typecheck/test/lint gates plus protocol URI conformance and IID acceptance suites. Keep `TMPDIR` outside Core for the conformance harness. Preserve the existing contracts package version and ABI pins.
5. Record exact commands, candidate revisions, artifact digests, results and outstanding external gates in the release review. Do not declare registry-backed reproducibility before the versions exist on npm.

Before publication, temporary Core root overrides may point to absolute `file:` tarball paths for the three runtime packages and any unpublished transitive train dependencies, including classifications and IID. Bun resolves relative file paths against dependent workspaces, so use absolute paths. Restore the temporary overrides and lockfile before committing. Never commit a lockfile that records local tarball overrides, and never regenerate Core's lockfile from scratch.

## Publication and merge order

1. After review and explicit authorization to push/open PRs, prepare the packages and matching Core changes as coordinated reviews. Merge the approved packages implementation and release metadata first, keeping Core's consumption change unmerged while registry versions are unavailable.
2. With separate release authorization, publish the prerequisite package train using the repository's reviewed release process and `release-plan.json` order. IID must be available before classifications, and classifications before atom-enrichment. Publish parser, classification, enrichment, and atom-runtime as `0.1.0-alpha.0` on the `alpha` tag. An already published immutable version must not be overwritten; use a new version and update dependents if its content differs from the reviewed candidate.
3. Verify exact registry versions before finalizing Core's dependency resolution:

   ```sh
   npm view @0xintuition/iid@0.1.0-alpha.0 version
   npm view @0xintuition/classifications@0.1.0-alpha.1 version
   npm view @0xintuition/atom-parser@0.1.0-alpha.0 version
   npm view @0xintuition/atom-classification@0.1.0-alpha.0 version
   npm view @0xintuition/atom-enrichment@0.1.0-alpha.0 version
   npm view @0xintuition/ids@0.1.0-alpha.1 version
   ```

   A failed lookup is a release gate. Continue artifact-based verification without treating it as registry availability.
4. In Core, pin the public runtime dependencies to the approved exact versions, remove the corresponding local implementations and example, and retain the exact `@0xintuition/ids@0.1.0-alpha.1` pin. Classifications is now a transitive dependency through the public enrichment manifest, which pins `@0xintuition/classifications@0.1.0-alpha.1`; it is no longer a direct Core workspace dependency. Remove all temporary overrides before resolving registry packages.

   Bun 1.3.11 cannot directly update this existing lockfile after all four old workspace manifests have disappeared: it fails while looking up stale workspace records. Use the staged transition below to splice the new dependency entries into the existing lockfile without regenerating it. Temporarily restore **only** the four old `package.json` files, preserving the new exact dependencies in the remaining Core consumers. Install once with the local age exception, remove only those temporary manifests, then perform a normal install to remove the obsolete workspace records.

   Run this from the Core repository root after all registry lookups in step 3 succeed. `cbbf5c6` is the Core pre-migration commit containing the four original manifests; keep that pinned reference when applying this procedure to subsequent migration commits. No implementation sources need to be restored.

   ```sh
   python3 - <<'PYTHON'
   from pathlib import Path
   import subprocess

   base = 'cbbf5c6'
   names = (
       'atom-parser',
       'atom-classification',
       'atom-enrichment',
       'atom-classification-example-plugin',
   )
   paths = [Path('packages') / name / 'package.json' for name in names]
   if any(path.exists() or path.is_symlink() for path in paths):
       raise SystemExit('Stop: an original workspace manifest is still present.')
   originals = {
       path: subprocess.check_output(['git', 'show', f'{base}:{path.as_posix()}'])
       for path in paths
   }
   for path, contents in originals.items():
       path.parent.mkdir(parents=True, exist_ok=True)
       path.write_bytes(contents)
   try:
       subprocess.run(['bun', 'install', '--minimum-release-age=0'], check=True)
   finally:
       for path, contents in originals.items():
           if path.is_file() and path.read_bytes() == contents:
               path.unlink()
   subprocess.run(['bun', 'install'], check=True)
   subprocess.run(['bun', 'install', '--frozen-lockfile'], check=True)
   PYTHON
   bun run guard:supply-chain
   ```

   The staged sequence was verified locally with absolute tarball overrides: it removed the four obsolete workspace records and preserved unrelated lock records. Registry resolution remains gated on publication. For pre-publication verification, use the same temporary-manifest sequence with the candidate tarball overrides, then restore the original lockfile and remove those overrides before committing. Neither the temporary manifests nor override-generated lock entries belong in the final change.

   Core's 14-day minimum release age would otherwise prevent initial resolution of fresh versions. The exception above runs **once locally**, in the first install only. Do not add it to a workflow or change `bunfig.toml` or the supply-chain guard. The second install uses the newly resolved entries, and the frozen install verifies the resulting graph. Subsequent installs use the committed registry lockfile and the normal frozen install command. Review the lockfile diff to confirm unrelated dependency records remain unchanged.

5. Commit the resulting normal registry lockfile with the dependency pins, rerun Core's full verification and packed-consumer checks, and merge the Core change only after those gates pass. Until then, the Core review must explicitly state that the registry lockfile follows publication.

## Remote inspection boundary

Parser remote inspection checks schemes and literal hostnames on each request and redirect. Its default private-host filtering rejects localhost and private IP literals, including private IPv4 embedded in IPv6. Body consumption is bounded by the request timeout and configured byte limit; `connectTimeoutMs` is retained for compatibility but does not enforce a separate connection deadline.

These checks do not resolve DNS, bind the connection to a vetted address, or prevent DNS rebinding. A public hostname can still resolve to a restricted destination. Production services accepting untrusted URLs must enforce destination restrictions through egress controls or an appropriate transport/proxy. Remote inspection can be disabled with `{ remoteFetch: false }`. These deployment requirements remain Core's responsibility; passing parser tests does not establish a complete SSRF boundary.

## Separate follow-ups

This extraction does not bump Core's `@0xintuition/contracts-v2`, replace its legacy testnet address book with `@0xintuition/deployments`, or wire `composeIidWorkerAdapters` into production. Those require separately reviewed ABI/handler/pin changes, deployment decisions and IID runtime integration respectively.

## Shared composition root

`@0xintuition/atom-runtime@0.1.0-alpha.0` replaces consumer-owned engine wiring.
Pass explicit configuration to `createProcessingRuntime({ env, cache, classification, enrichment })`
or use `createProcessingRuntime({ config, runtime, overrides })` for injected services and plugins.
The root and `presets`, `fingerprint`, `consumers`, `config`, and `adapters/upstash` subpaths are public.
`onClassifierError` is optional; provided callbacks receive classifier failures without changing results.
Use `classification.engine()` and `enrichment.engine(preset, identity)` to reuse engines; the reference
`createEngine` methods remain aliases. Call `dispose()` when the composition is no longer needed.
Environment reads occur only in explicitly called FromEnv adapter helpers. The runtime itself takes
an environment map and forwards only its documented provider settings.
