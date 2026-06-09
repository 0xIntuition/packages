# Intuition Hackathon Quickstart

Small Vite/React example that consumes the Intuition packages as a builder would.

No API key or wallet is required. This is a dry-run package showcase, not a live submit
flow.

The example intentionally focuses on one lifecycle:

1. Choose the `music-recording` classification.
2. Build atom data from recommended classification fields.
3. Inspect the schema.org field superset for `MusicRecording`.
4. Resolve promoted metadata predicates.
5. Use the metadata predicate matrix to understand expected object targets for triples.

It includes three surfaces:

- a local playground where changing sample values updates package-derived atom data and triple previews
- an identity-linking page that keeps strict `sameAs` matches separate from low-confidence candidates and shows pre-activation payload links vs post-activation triples
- a guided walkthrough that explains which package is responsible for each part of the lifecycle
- paired code examples showing the package imports and calls next to the data they produce

Run it from the monorepo root:

```sh
bun install
bun --filter @0xintuition/hackathon-quickstart-example dev
```

Open the printed local Vite URL, usually `http://localhost:5173`.

While this example lives in the monorepo it depends on the packages through `workspace:*`.
After the packages are published, a standalone community template should switch those to the
published npm versions.

## How to demo it

Use the screen as a five-step walkthrough:

1. Start with the local playground and edit the track name, artist, album, or playlist target.
2. Show that the atom-data JSON updates from the classification fields only, then use the paired code examples to show the imports behind each surface.
3. Switch to Identity linking and adjust the confidence threshold.
4. Show that pre-activation `sameAs` can be serialized into atom data, which changes the atom ID.
5. Show that post-activation growth uses a `sameAs` triple instead of mutating the original atom payload.
6. End on the TypeScript snippet showing the package calls an app would use.

The generated output is the plan a submit layer would consume:

- atom data for the Spotify song atom
- predicate IDs for promoted relationships
- expected object targets from the matrix
- triple previews such as `Spotify song atom -> inPlaylist -> My Songs Playlist`
- strict identity previews such as `Spotify song atom -> sameAs -> Apple Music song atom`
- deterministic ID examples showing why payload growth and graph growth are different lifecycle choices

The first pass is dry-run only. Protocol/API submission can be layered in once the package
contracts are reviewed and published.
