# Build the knowledge graph off-chain first: an intro to the Intuition packages (and where they're heading)

*Draft forum post — for the Intuition community forum. Written developer-to-developer.*

---

Hey everyone 👋

I want to introduce something we've been building that I think changes how you'll build on Intuition: a
set of focused TypeScript packages that let you **model the entire knowledge graph off-chain first**, for
free, and only settle on-chain when it actually matters.

This post is a proper introduction — what the packages are, the concepts behind them, how to think about
them — plus a peek at where we're taking them next. It's long-ish because there's a real mental model here,
but each piece is simple on its own. Grab a coffee.

## The shift: off-chain first

If you've built on-chain before, you know the tax: **every piece of data costs a transaction.** Put a fact
on the graph? Pay. Connect two things? Pay again. That model quietly kills experimentation — you don't
prototype freely when every idea has a gas bill attached.

The packages flip this. You can define atoms, wire up relationships, compute IDs, build whole creation
flows and UIs — **entirely off-chain, entirely free** — and bring things on-chain only when they're worth
settling. The official quickstart is dry-run by design: no wallet, no API key, no live submission needed.

```bash
cd examples/hackathon-quickstart
bun run dev
```

Off-chain to move fast. On-chain when it counts. Everything below serves that idea.

## The core concepts (the whole graph in three words)

Intuition's knowledge graph is built from a tiny, composable vocabulary:

- **Atoms** — the nouns. A person, a song, an org, a URL, a concept. Anything you can point at.
- **Predicates** — the verbs / relationships. `member of`, `authored by`, `same as`, `trusts`.
- **Triples** — a statement made of the two: **subject → predicate → object.**
  `Alice → member of → Acme`. That's an edge in the graph.

Two more ideas that matter a lot:

- **Deterministic IDs.** Every atom, predicate, and triple has a **content-addressable ID** you can compute
  *before* anything touches a chain. Same content → same ID, everywhere, forever. This is the quiet
  superpower: your off-chain graph and the eventual on-chain graph speak the same identifiers, so there's no
  "import/sync" cliff — you're always building the real thing.
- **`sameAs` identity.** Different atoms can point at the same real-world thing (the same song on Spotify
  and Apple Music, the same person across two profiles). `sameAs` links them so the graph can treat them as
  one identity without forcing everyone to agree on a single canonical atom up front.

If you internalize atoms / predicates / triples / deterministic IDs / sameAs, you understand Intuition.

## The packages, by layer

We split everything into small, ESM-only packages so you install **only the layer you need** while
converging on shared vocabulary and IDs. Here's the map and how to think about each:

### 🧩 Semantic / data modeling — *what things are and how they relate*

- **`@0xintuition/schema-org`** — a pinned [schema.org](https://schema.org) vocabulary (types + properties,
  with inherited-property lookup). This is the shared dictionary so a "MusicRecording" means the same thing
  in your app and mine.
- **`@0xintuition/classifications`** — Intuition classification specs and **Creation Profiles**: the
  recommended fields for a given kind of thing, plus the relationships that make sense for it. This is what
  lets you render a correct "create a song" form without hardcoding it.
- **`@0xintuition/predicates`** — the canonical **predicate registry**: the blessed set of relationships,
  their deterministic IDs, display helpers, and which predicates suit which entity types. When you need a
  relationship, you reach here.

### 🔑 Identity — *stable names for everything*

- **`@0xintuition/ids`** — deterministic, content-addressable IDs for atoms, predicates, triples,
  counter-triples, and OAuth atoms. The backbone that makes off-chain-first coherent.

### 🛠️ Builder helpers — *the ergonomic layer*

- **`@0xintuition/primitives`** — high-level builders and validators for atoms, claims, triples, and
  discovery. Instead of assembling raw structures, you call `buildTripleByName(...)` and get a validated
  result. This is where most app code lives.

### ⚙️ Protocol plumbing — *when you're ready to go on-chain*

- **`@0xintuition/protocol`** — core contract ABIs, event parsers, interaction helpers.
- **`@0xintuition/deployments`** — typed chain metadata and deployment addresses.
- **`@0xintuition/periphery`** — periphery ABIs and bridge/router helpers.
- **`@0xintuition/curves`** — bonding-curve math for the market/staking side.
- **`@0xintuition/react`** — React hooks for the core protocol interactions.

The beauty of the layering: you can live entirely in the top three layers while prototyping, and only pull
in the protocol layer when your app owns wallet + submission flow.

## How they work together (a tiny walkthrough)

Say you're building a music app. Start from a Creation Profile:

```ts
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording'

const fields = musicRecordingCreationProfile.fields          // render your atom form
const relationships = musicRecordingCreationProfile.relationships  // suggest valid triples
// e.g. MusicRecording -> inPlaylist -> MusicPlaylist
```

Use `fields` to render inputs, `relationships` to suggest predicates, `primitives` to build and validate
the triple, and `ids` to know its ID before you ever sign. Your UI is generated **from the package data**
instead of an app-local shadow copy that drifts. When (and if) you're ready, the protocol layer settles it
on-chain — with the exact same IDs you've been using all along.

That's the loop: **model → validate → (optionally) settle**, with deterministic identity the whole way.

## Where this is heading: predicates that describe themselves

Here's the part I'm most excited to build *with you*.

Right now a predicate's meaning mostly lives in its name and description — great for humans, opaque to
machines. We're exploring giving each predicate a little **machine-readable metadata about how the
relationship behaves**, so the graph can actually reason:

- **Symmetric?** `Acme → partner of → BigCo` implies the reverse automatically.
- **Has an inverse?** `parent org` ⇄ `subsidiary of` — assert one, get the other.
- **Transitive?** venue in district in city ⟹ venue in city, as one query.
- **Carries sentiment?** `endorse` is positive, `distrust` negative — so reputation becomes something the
  graph computes instead of every app hardcoding it.
- **What's on the other end?** entity vs. raw value vs. *another claim* — one field that lets a frontend
  render any edge with zero custom code.

Circle back to `sameAs`: imagine a song created from a Spotify link, and later someone connects the Apple
Music version **as a real edge**. Now "give me every link for this track," "what does the community know
about it," and "are these two items secretly the same thing?" all become answerable by walking connected
triples. That last one — knowing two nodes are the same reality — is exactly what machine-readable
predicates unlock, and it's everywhere: identity, products, tokens, provenance.

This is grounded in the same ideas 30 years of knowledge-graph work (RDF, OWL, schema.org) landed on — we're
adapting the proven parts and cutting the over-engineered ones. And the vocabulary isn't settled, which is
why I'm posting now.

## Come build with us

An open invitation:

- 🧪 **Prototype something.** Everything's on npm (`@alpha`) and runs off-chain out of the box. Start from
  the quickstart, define some atoms and triples, break things, show us.
- 💬 **Bring your use case.** Music, identity, DeFi, social, science, provenance — every domain has
  relationships that want to be first-class. Tell us yours and we'll model the predicates together.
- ❓ **Ask hard questions.** Especially "wait, how would this handle…" — those are how we find the gaps.
- 🔧 **Argue the design.** Are `symmetric` / `transitive` / `inverse` the right words or too academic? What
  relationship properties are we missing? Where's the line between expressive and over-complicated? Reply and
  push on it.

The dream is a knowledge graph you can build for free, that renders itself, queries across relationships
intelligently, knows when two things are the same, and can even represent disagreement — settled on-chain
only when it matters. I think we can get there, and it's more fun to figure out with you.

What would you build first? 👇

— *[your name]*
