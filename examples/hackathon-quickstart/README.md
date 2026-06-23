# Intuition Hackathon Quickstart

Small Vite/React example that consumes the Intuition packages as a builder would.

No API key or wallet is required. This is a dry-run package showcase, not a live submit
flow.

The example intentionally focuses on one lifecycle:

1. Import the `music-recording` Creation Profile.
2. Build atom data from recommended profile fields.
3. Inspect schema provenance and the available schema field count for `MusicRecording`.
4. Resolve promoted metadata predicates from the profile relationships.
5. Use relationship expected-object targets to plan triples.

It includes five review surfaces:

- a local playground where changing sample values updates package-derived atom data and triple previews
- an identity-linking page that keeps strict `sameAs` matches separate from low-confidence candidates and shows pre-activation payload links vs post-activation triples
- a generated UI page that turns Creation Profiles into entity-specific creation surfaces
- a guided walkthrough that explains which package is responsible for each part of the lifecycle
- paired code examples showing the package imports and calls next to the data they produce

Run it from the monorepo root:

```sh
bun install
bun --filter @0xintuition/hackathon-quickstart-example dev
```

Open the printed local Vite URL, usually `http://localhost:5173`.

While this example lives in the monorepo it depends on the packages through `workspace:*`.
A standalone community template should use the published npm package versions instead.

For browser create flows, the example imports direct Creation Profile subpaths such as
`@0xintuition/classifications/creation/music-recording`. That gives the UI the recommended
fields, schema provenance, predicate IDs, and relationship object models without importing the
full schema.org registry into the client bundle. Root helpers such as `getPropertiesFor(...)`
remain useful for dynamic server/admin/explorer tooling.

## How to demo it

Use the screen as a six-step walkthrough:

1. Start with the local playground and edit the track name, artist, album, or playlist target.
2. Show that the atom-data JSON updates from the classification fields only, then use the paired code examples to show the imports behind each surface.
3. Switch to Identity linking and adjust the confidence threshold.
4. Show that pre-activation `sameAs` can be serialized into atom data, which changes the atom ID.
5. Show that post-activation growth uses a `sameAs` triple instead of mutating the original atom payload.
6. Switch to Generated UI and show how the same Creation Profile data can drive entity-specific creation controls.

The generated output is the plan a submit layer would consume:

- atom data for the Spotify song atom
- predicate IDs for promoted relationships
- expected object targets from the matrix
- triple previews such as `Spotify song atom -> inPlaylist -> My Songs Playlist`
- strict identity previews such as `Spotify song atom -> sameAs -> Apple Music song atom`
- deterministic ID examples showing why payload growth and graph growth are different lifecycle choices

This template is dry-run only. Protocol/API submission can be layered on top by an app or
service that owns live writes.
